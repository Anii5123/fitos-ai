import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/mailService.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email address is already in use');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new User({
      email,
      password,
      name,
      verificationToken,
      verificationTokenExpires,
    });

    await user.save();

    // Send email (runs in background, errors logged inside service)
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. A verification email has been sent to your inbox.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired email verification token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email address has been successfully verified.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError('Invalid email or password credentials');
    }

    const payload = { userId: String(user._id), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token to user
    user.refreshTokens.push(refreshToken);
    // Keep maximum 5 refresh tokens for safety
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { googleId, email, name, imageUrl } = req.body;

    if (!googleId || !email) {
      throw new BadRequestError('Google ID and email credentials are required');
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create new user if not exist, auto-verified
      user = new User({
        email,
        googleId,
        name,
        isVerified: true,
      });
    } else if (!user.googleId) {
      // Link Google Account to existing user email
      user.googleId = googleId;
      if (!user.name) user.name = name;
      user.isVerified = true; // Trust Google emails
    }

    const payload = { userId: String(user._id), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new BadRequestError('Refresh token is required');
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(token)) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    // Token Rotation: Generate new token set
    const newPayload = { userId: String(user._id), role: user.role };
    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Replace old refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(new UnauthorizedError('Refresh token is invalid or expired'));
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (token) {
      // Find user and remove refresh token
      await User.updateOne(
        { refreshTokens: token },
        { $pull: { refreshTokens: token } }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 for security reasons to prevent email enumeration
      res.status(200).json({
        status: 'success',
        message: 'If a matching user was found, a password reset link has been dispatched.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendResetPasswordEmail(email, resetToken);

    res.status(200).json({
      status: 'success',
      message: 'If a matching user was found, a password reset link has been dispatched.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    // Assigning will trigger the mongoose pre-save bcrypt hash Hook
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    // Wipe refresh tokens on password change for security
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password has been successfully updated. You may now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await User.findById(req.user.userId).select('-password -refreshTokens');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    next(error);
  }
};

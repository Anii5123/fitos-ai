import PDFDocument from 'pdfkit';
import { IMonthlyReport } from '../models/MonthlyReport.js';

export const generateMonthlyReportPDF = (
  report: IMonthlyReport,
  userName: string,
  userEmail: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // -------------------------------------------------------------
      // Header Page
      // -------------------------------------------------------------
      
      // Theme Colors
      const primaryColor = '#10B981'; // Emerald
      const darkColor = '#1E293B';    // Slate
      const lightColor = '#F8FAFC';   // Soft Gray
      const accentColor = '#6366F1';  // Indigo

      // Header Banner
      doc.rect(0, 0, 595.28, 120).fill(darkColor);

      // Title
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(24)
         .text('FITTRACK AI', 50, 40);

      doc.fontSize(12)
         .font('Helvetica')
         .text('Your Personal AI Transformation Companion', 50, 70);

      // Metadata Block
      doc.fillColor(darkColor)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(`Monthly Progress Report: ${report.month}`, 50, 150);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#64748B')
         .text(`Generated For: ${userName} (${userEmail})`, 50, 175)
         .text(`Date Created: ${new Date().toLocaleDateString()}`, 50, 190);

      doc.moveDown();

      // Divider Line
      doc.moveTo(50, 210).lineTo(545, 210).stroke('#E2E8F0');

      // -------------------------------------------------------------
      // Monthly Averages Grid
      // -------------------------------------------------------------
      doc.fillColor(darkColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Monthly Averages & Metrics', 50, 230);

      // We draw blocks for 3 key figures
      const colWidth = 150;
      const startX = 50;
      const startY = 255;

      // Card 1: Calories
      doc.rect(startX, startY, colWidth, 70).fill(lightColor);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(16).text(`${report.averageCalories} kcal`, startX + 15, startY + 15);
      doc.fillColor(darkColor).font('Helvetica').fontSize(10).text('Avg Consumed Daily', startX + 15, startY + 45);

      // Card 2: Protein
      doc.rect(startX + colWidth + 15, startY, colWidth, 70).fill(lightColor);
      doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(16).text(`${report.averageProtein}g`, startX + colWidth + 30, startY + 15);
      doc.fillColor(darkColor).font('Helvetica').fontSize(10).text('Avg Daily Protein', startX + colWidth + 30, startY + 45);

      // Card 3: Steps
      doc.rect(startX + (colWidth * 2) + 30, startY, colWidth, 70).fill(lightColor);
      doc.fillColor('#F59E0B').font('Helvetica-Bold').fontSize(16).text(`${report.averageSteps}`, startX + (colWidth * 2) + 45, startY + 15);
      doc.fillColor(darkColor).font('Helvetica').fontSize(10).text('Avg Daily Steps', startX + (colWidth * 2) + 45, startY + 45);

      // Weight & BMI updates
      doc.moveDown(7);
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(12).text('Body Weight Dynamics:', 50, 345);
      doc.font('Helvetica').fontSize(10).text(`Weight Change: ${report.weightChange > 0 ? '+' : ''}${report.weightChange} kg`, 50, 365);
      doc.text(`BMI Adjustment: ${report.bmiChange > 0 ? '+' : ''}${report.bmiChange}`, 50, 380);
      doc.text(`Cheat Meals Registered: ${report.cheatMealsCount} days`, 50, 395);

      // -------------------------------------------------------------
      // Habit Consistency Scores
      // -------------------------------------------------------------
      doc.fillColor(darkColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Habit Compliance Scores', 50, 425);

      const scoreY = 450;
      doc.fontSize(10).font('Helvetica').fillColor(darkColor);

      // Calorie compliance
      doc.text(`Calorie Budget Compliance: ${report.complianceScores.calorie}%`, 50, scoreY);
      doc.rect(250, scoreY - 2, 200, 10).fill('#E2E8F0');
      doc.rect(250, scoreY - 2, 200 * (report.complianceScores.calorie / 100), 10).fill(primaryColor);

      // Protein compliance
      doc.fillColor(darkColor).text(`Protein Goal Compliance: ${report.complianceScores.protein}%`, 50, scoreY + 20);
      doc.rect(250, scoreY + 18, 200, 10).fill('#E2E8F0');
      doc.rect(250, scoreY + 18, 200 * (report.complianceScores.protein / 100), 10).fill(accentColor);

      // Step compliance
      doc.fillColor(darkColor).text(`Step Targets Compliance: ${report.complianceScores.activity}%`, 50, scoreY + 40);
      doc.rect(250, scoreY + 38, 200, 10).fill('#E2E8F0');
      doc.rect(250, scoreY + 38, 200 * (report.complianceScores.activity / 100), 10).fill('#F59E0B');

      // -------------------------------------------------------------
      // Top Foods Consumed
      // -------------------------------------------------------------
      if (report.topFoodsConsumed && report.topFoodsConsumed.length > 0) {
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(14).text('Most Consumed Foods', 50, 520);
        let foodY = 545;
        doc.font('Helvetica').fontSize(10);
        report.topFoodsConsumed.slice(0, 5).forEach((food, idx) => {
          doc.text(`${idx + 1}. ${food.name}`, 50, foodY);
          doc.text(`Logged ${food.count} times`, 250, foodY);
          foodY += 15;
        });
      }

      // Add a page break for the Coach's summary
      doc.addPage();

      // -------------------------------------------------------------
      // AI Coach Recommendations
      // -------------------------------------------------------------
      doc.rect(0, 0, 595.28, 60).fill(primaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('AI COACH REVIEW & FEEDBACK', 50, 20);

      doc.fillColor(darkColor).font('Helvetica-Oblique').fontSize(12).text('Report Summary:', 50, 90);
      doc.font('Helvetica').fontSize(10).fillColor('#334155').text(report.aiSummary, 50, 115, { width: 495, align: 'justify', lineGap: 4 });

      doc.moveDown(2);
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(12).text('Key Coach Suggestions for Next Month:', 50, 240);

      let suggestionY = 265;
      doc.font('Helvetica').fontSize(10).fillColor('#334155');
      report.suggestions.forEach((suggestion) => {
        doc.text(`•  ${suggestion}`, 60, suggestionY, { width: 485, lineGap: 3 });
        suggestionY += doc.heightOfString(`•  ${suggestion}`, { width: 485 }) + 8;
      });

      // Footer
      doc.fontSize(8).fillColor('#94A3B8').text('FitTrack AI - Secure, private health tracking powered by machine intelligence.', 50, 780, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

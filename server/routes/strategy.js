import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import Strategy from '../models/Strategy.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to generate fallback advice if AI fails
function generateFallbackAdvice(data) {
    const { studyHours, sleepHours, subjects, goals, mode, productivityPattern, stressLevel } = data;
    
    // Default fallback structured data matching what Gemini would output
    return {
        do: ["Use active recall", "Take 5-min breaks", "Hydrate"],
        avoid: ["Multitasking", "Studying in bed", "Social media"],
        improve: ["Test yourself", "Teach concepts"],
        tips: ["Consistency > Intensity"],
        timetable: [
            { time: "06:00 - 07:00", activity: "Wake Up", type: "Routine" },
            { time: "07:00 - 09:00", activity: "Deep Study", type: "Deep Study" },
            { time: "09:00 - 10:00", activity: "Break", type: "Break" }
        ],
        subjectStrategy: subjects ? subjects.map(s => ({ subject: s, tips: "Focus on basics", resources: [] })) : [],
        recommendedMaterials: [],
        focusAdvice: "Focus on one task at a time.",
        burnoutRisk: "Moderate",
        energyTip: "Rest appropriately."
    };
}

// Generate new strategy
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, studyHours, sleepHours, subjects, goals, mode, examFrequency, productivityPattern, stressLevel } = req.body;
        const userId = req.user.id;

        let wellnessScore = 100;
        if (sleepHours < 6) wellnessScore -= 20;
        else if (sleepHours > 9) wellnessScore -= 10;
        if (studyHours > 8) wellnessScore -= 15;
        else if (studyHours < 2) wellnessScore -= 10;

        let adviceData = generateFallbackAdvice(req.body);

        if (genAI) {
            try {
                const prompt = `Act as an elite Academic Performance Coach... Generate schedule for: Study: ${studyHours}h, Sleep: ${sleepHours}h, Subjects: ${subjects?.join(', ')}`;
                const result = await genAI.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                if (result.text) {
                    const text = result.text.replace(/^`json\s*/, '').replace(/\s*`$/, '');
                    adviceData = JSON.parse(text);
                }
            } catch (err) {
                console.warn("Gemini failing, using fallback", err.message);
            }
        }

        const strategy = new Strategy({
            user: userId,
            name: name || 'Latest Strategy',
            studyHours,
            sleepHours,
            subjects,
            goals,
            mode,
            examFrequency,
            productivityPattern,
            stressLevel,
            wellnessScore,
            advice: adviceData
        });

        await strategy.save();
        res.status(201).json(strategy);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate strategy' });
    }
});

// Get user strategies
router.get('/', authMiddleware, async (req, res) => {
    try {
        const strategies = await Strategy.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(strategies);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

export default router;

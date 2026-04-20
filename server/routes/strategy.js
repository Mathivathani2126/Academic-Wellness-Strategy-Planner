import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import Strategy from '../models/Strategy.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to generate fallback advice if AI fails
function generateFallbackAdvice(data) {
    const { studyHours = 4, sleepHours = 7, subjects = [], goals = [], mode = 'Balanced', productivityPattern = 'Morning', stressLevel = 'Moderate' } = data;
    
    const subjectList = subjects.length > 0 ? subjects : ['General Studies'];
    
    const subjectStrategy = subjectList.map(s => {
        let tips = "Emphasize active recall and structured review cycles. Use spaced repetition to reinforce core concepts.";
        let resources = ["Course Textbook", "Official Course Modules", "Quizlet Flashcards"];
        
        const sub = s.toLowerCase();
        if (sub.includes('math') || sub.includes('phy') || sub.includes('calc')) {
            tips = "Prioritize problem-solving over passive reading. Practice at least 20 varied questions daily to build solid muscle memory and pattern recognition.";
            resources = ["Khan Academy", "Practice Worksheets", "Formula Cheat Sheet", "Past Exam Papers"];
        } else if (sub.includes('bio') || sub.includes('chem') || sub.includes('med')) {
            tips = "Use mnemonic devices and visual flashcards for deep memorization. Focus on understanding mechanisms, biological systems, and chemical reactions visually.";
            resources = ["Anki Decks", "3D Interactive Models", "Concept Maps", "YouTube Explainer Videos"];
        } else if (sub.includes('eng') || sub.includes('hist') || sub.includes('lit')) {
            tips = "Focus on thematic understanding and essay structuring. Create mind maps linking key historical events or literary themes.";
            resources = ["Essay Outlines", "Historical Timelines", "Critical Analysis Papers"];
        } else if (sub.includes('cs') || sub.includes('code') || sub.includes('comp')) {
            tips = "Build small projects to apply concepts. Spend less time reading docs and more time actually writing and debugging code.";
            resources = ["LeetCode", "GitHub Repositories", "Interactive Coding Environments"];
        }
        
        return { subject: s, tips, resources };
    });

    const focusAdvice = stressLevel === 'High' 
        ? "Your stress levels are running high. Prioritize 10-minute mindful breathing or walking breaks after every 30 minutes of study. Be gentle with yourself today."
        : mode === 'Intensive'
        ? "You've selected an Intensive plan. Focus your highest mental energy on your hardest subject right off the bat while your mind is sharp."
        : "You're in a good zone. Maintain a steady pace, tackle one subject at a time, and don't forget to stay hydrated.";

    let energyTip = "Take a 20-min power nap if you hit a mid-day slump to reset your cognitive load.";
    if (productivityPattern === 'Morning') {
        energyTip = "Get 10 minutes of natural sunlight within 30 minutes of waking up to set your circadian rhythm and boost morning alertness.";
    } else if (productivityPattern === 'Night') {
        energyTip = "Keep your study environment brightly lit to stave off sleepiness, but use a blue-light filter to protect your eyes.";
    } else if (productivityPattern === 'Afternoon') {
        energyTip = "Avoid heavy carbohydrate-rich lunches to prevent the 2 PM energy crash. Opt for protein and greens.";
    }

    let timetable = [];
    if (productivityPattern === 'Morning') {
        timetable = [
            { time: "06:00 - 07:00", activity: "Wake Up, Hydrate & Light Exercise", type: "Routine" },
            { time: "07:00 - 09:00", activity: `Deep Focus: ${subjectList[0]}`, type: "Deep Study" },
            { time: "09:00 - 09:30", activity: "Healthy Breakfast", type: "Break" },
            { time: "09:30 - 11:30", activity: `Core Learning: ${subjectList[1] || 'Review'}`, type: "Deep Study" },
            { time: "11:30 - 12:30", activity: "Active Recall Testing", type: "Revision" },
            { time: "12:30 - 13:30", activity: "Lunch & Disconnect", type: "Relaxation" },
            { time: "13:30 - 15:00", activity: "Light Review & Organization", type: "Light Study" },
            { time: "15:00 - 18:00", activity: "Extracurriculars / Hobbies", type: "Routine" },
            { time: "18:00 - 19:30", activity: "Dinner & Wind Down", type: "Routine" },
            { time: "19:30 - 20:30", activity: "Prepare for Tomorrow", type: "Light Study" },
            { time: "20:30 - 22:00", activity: "Digital Detox & Read", type: "Relaxation" },
            { time: "22:00 - 06:00", activity: "Sleep", type: "Sleep" }
        ];
    } else if (productivityPattern === 'Night') {
        timetable = [
            { time: "10:00 - 11:00", activity: "Slow Wake Up & Breakfast", type: "Routine" },
            { time: "11:00 - 13:00", activity: "Light Study & Preparation", type: "Light Study" },
            { time: "13:00 - 14:00", activity: "Lunch & Relaxation", type: "Relaxation" },
            { time: "14:00 - 16:00", activity: `Core Learning: ${subjectList[1] || 'Review'}`, type: "Deep Study" },
            { time: "16:00 - 18:00", activity: "Extracurriculars / Break", type: "Routine" },
            { time: "18:00 - 19:00", activity: "Dinner", type: "Routine" },
            { time: "19:00 - 21:00", activity: `Deep Focus: ${subjectList[0]}`, type: "Deep Study" },
            { time: "21:00 - 22:00", activity: "Active Recall Testing", type: "Revision" },
            { time: "22:00 - 00:00", activity: "Homework & Assignments", type: "Light Study" },
            { time: "00:00 - 01:00", activity: "Wind Down & Disconnect", type: "Relaxation" },
            { time: "01:00 - 09:00", activity: "Sleep", type: "Sleep" }
        ];
    } else {
        // Balanced afternoon/evening
        timetable = [
            { time: "07:30 - 08:30", activity: "Wake Up & Breakfast", type: "Routine" },
            { time: "08:30 - 10:30", activity: "Light Study & Reading", type: "Light Study" },
            { time: "10:30 - 11:00", activity: "Short Break", type: "Break" },
            { time: "11:00 - 12:30", activity: `Core Learning: ${subjectList[1] || 'Review'}`, type: "Deep Study" },
            { time: "12:30 - 13:30", activity: "Lunch & Relaxation", type: "Relaxation" },
            { time: "13:30 - 15:30", activity: `Deep Focus: ${subjectList[0]}`, type: "Deep Study" },
            { time: "15:30 - 16:30", activity: "Active Recall Testing", type: "Revision" },
            { time: "16:30 - 18:30", activity: "Exercise / Hobbies", type: "Routine" },
            { time: "18:30 - 19:30", activity: "Dinner", type: "Routine" },
            { time: "19:30 - 21:30", activity: "Prepare for Tomorrow", type: "Light Study" },
            { time: "21:30 - 22:30", activity: "Wind Down", type: "Relaxation" },
            { time: "22:30 - 07:30", activity: "Sleep", type: "Sleep" }
        ];
    }

    return {
        do: [
            "Use the Pomodoro technique (25m deep work / 5m active break) to maintain peak focus.",
            "Hydrate consistently—aim for at least 2 liters of water spread evenly throughout the day.",
            "Review your notes within 24 hours of first learning them to maximize long-term retention.",
            "Ensure your primary study environment is well-lit, organized, and free of digital distractions.",
            "Plan your top 3 tasks for tomorrow each night so you can start immediately in the morning."
        ],
        avoid: [
            "Multitasking while studying—it reduces cognitive efficiency by up to 40% and increases errors.",
            "Studying in bed, which confuses your brain's spatial association and disrupts sleep hygiene.",
            "Consuming caffeine after 3 PM or within 8 hours of bedtime, as it impairs deep REM sleep cycles.",
            "Cramming the night before exams; distributed, spaced practice is fundamentally more effective.",
            "Endless scrolling on social media during study breaks—choose a stretch or walk instead."
        ],
        improve: [
            "Implement active recall and self-testing instead of passive rereading and highlighting.",
            "Attempt to teach complex concepts to an imaginary audience to verify your understanding (Feynman Technique).",
            "Track your focused study sessions to identify the times of day your productivity dips or peaks."
        ],
        tips: [
            "Consistency compounds over time. An hour every single day is vastly better than seven hours cramming on Sunday.",
            "Sleep is exactly when memory consolidation happens. Never sacrifice your sleep for extra study time.",
            "Regularly reward yourself after successfully completing difficult blocks to reinforce positive habits."
        ],
        timetable,
        subjectStrategy,
        recommendedMaterials: subjectList.map(s => ({
            subject: s,
            focusArea: "Core Fundamentals & Theory",
            materials: ["Past Examination Papers", "Interactive E-Learning Modules", "Chapter Summary Notes", "Practice Quizzes"]
        })),
        focusAdvice,
        burnoutRisk: stressLevel === 'High' ? "High" : stressLevel === 'Low' ? "Low" : "Moderate",
        energyTip
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
                const prompt = `Act as an elite Academic Performance Coach. Create a personalized, highly detailed wellness and study strategy based on these inputs:
- Study Hours: ${studyHours}h
- Sleep Hours: ${sleepHours}h
- Subjects: ${subjects?.join(', ') || 'General Studies'}
- Goals: ${goals?.join(', ') || 'Improve Academic Performance'}
- Mode: ${mode}
- Exam Frequency: ${examFrequency || 'Moderate'}
- Productivity Peak: ${productivityPattern || 'Morning'}
- Stress Level: ${stressLevel || 'Moderate'}

You MUST return a JSON object ONLY matching this precise schema:
{
  "do": ["string (at least 5 actionable, specific tips)"],
  "avoid": ["string (at least 5 things to avoid)"],
  "improve": ["string (at least 3 core areas of improvement)"],
  "tips": ["string (at least 3 general wisdom tips)"],
  "timetable": [
    {
      "time": "HH:MM - HH:MM",
      "activity": "string (very specific, e.g., 'Deep Work: ${subjects?.length > 0 ? subjects[0] : 'Study'}')",
      "type": "string (MUST be one of: 'Deep Study', 'Light Study', 'Revision', 'Break', 'Relaxation', 'Sleep', 'Routine')"
    }
  ],
  "subjectStrategy": [
    {
      "subject": "string",
      "tips": "string (specific strategy for this subject)",
      "resources": ["string"]
    }
  ],
  "recommendedMaterials": [
    {
      "subject": "string",
      "focusArea": "string",
      "materials": ["string"]
    }
  ],
  "focusAdvice": "string (A motivational and highly specific sentence for today)",
  "burnoutRisk": "string ('Low', 'Moderate', or 'High' based on inputs)",
  "energyTip": "string (An action to boost energy right now)"
}

Instructions for timetable:
Make the timetable highly detailed, filling a full 24-hour cycle. Break it down into 1-2 hour chunks. Provide at least 10-15 distinct entries reflecting the exact ${studyHours}h of study and ${sleepHours}h of sleep. Base the main study blocks around the "Productivity Peak" provided (${productivityPattern}).
Do not include any Markdown formatting like \`\`\`json. Return raw valid JSON.`;
                const result = await genAI.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                if (result.text) {
                    try {
                        const rawText = result.text;
                        const cleanedText = rawText.replace(/```(json)?/gi, '').trim();
                        adviceData = JSON.parse(cleanedText);
                    } catch (parseError) {
                        console.error("Failed to parse Gemini JSON output:", result.text);
                        // fallback remains
                    }
                }
            } catch (err) {
                console.warn("Gemini call failed or connection issue:", err.message);
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

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
    
    // Hash function to make "random" selection deterministic based on subject string
    const getHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash);
    };

    const actionVerbs = ["Analyze", "Review", "Deconstruct", "Synthesize", "Practice", "Outline", "Map out", "Investigate", "Drill"];
    const focusAreas = ["Core Fundamentals", "Advanced Problem Solving", "Theoretical Frameworks", "Practical Application", "Exam Technique", "Memorization", "Analytical Thinking"];
    const materialTypes = ["Past Papers", "Video Lectures", "Flashcards", "Concept Maps", "Interactive Quizzes", "Summary Sheets", "Case Studies", "Textbook Chapters", "Study Group Notes"];

    const subjectStrategy = subjectList.map((s, index) => {
        const hash = getHash(s.toLowerCase().trim() || "x");
        
        let customTips = [];
        const isMathy = s.toLowerCase().includes('math') || s.toLowerCase().includes('phy') || s.toLowerCase().includes('calc');
        const isSci = s.toLowerCase().includes('bio') || s.toLowerCase().includes('chem') || s.toLowerCase().includes('med');
        const isHum = s.toLowerCase().includes('eng') || s.toLowerCase().includes('hist') || s.toLowerCase().includes('lit') || s.toLowerCase().includes('eco');
        
        if (isMathy) {
            customTips = [
                `Complete ${4 + (hash % 5)} varied practice problems under timed conditions.`,
                "Work backwards from the answer key to understand the methodology.",
                "Build a personalized formula sheet specifically for " + s + " topics.",
                "Identify and resolve bottlenecks in your foundational arithmetic or algebra.",
                `Drill past exam setups relating to ${s}'s core theorems.`
            ];
        } else if (isSci) {
            customTips = [
                "Utilize spatial memory by drawing 3D diagrams of relevant systems.",
                "Link individual facts to the broader scientific framework.",
                "Create active-recall flashcards for key terminology and mechanisms.",
                "Watch visual explainer videos to solidify abstract concepts.",
                `Summarize textbook chapters of ${s} without looking at the material.`
            ];
        } else if (isHum) {
            customTips = [
                "Outline structured essays covering both supporting and opposing arguments.",
                "Draft chronological timelines to understand cause and effect.",
                "Analyze primary source texts for deeper thematic meaning.",
                "Engage in debates or discussions to solidify your stance on topics.",
                `Read secondary literature relating to ${s} to build context.`
            ];
        } else {
            customTips = [
                `${actionVerbs[hash % actionVerbs.length]} primary concepts and teach them to a peer.`,
                `Dedicate 25 minutes strictly to ${focusAreas[hash % focusAreas.length].toLowerCase()}.`,
                "Transform passive reading into active notes using the Cornell method.",
                "Test yourself on earlier modules to strengthen spaced repetition.",
                `Set up a specific ${s} study group to bounce ideas around.`
            ];
        }
        
        // Randomize based on hash and index so even identical categories get different tips
        const selectedTips = [
            customTips[(hash) % customTips.length],
            customTips[(hash + 1 + index) % customTips.length],
            customTips[(hash + 2 + index) % customTips.length],
            customTips[(hash + 3 + index) % customTips.length]
        ];
        
        // Remove duplicates and format
        const uniqueTips = [...new Set(selectedTips)];
        let tipsString = uniqueTips.map(t => "• " + t).join("\n");

        const resources = [
            materialTypes[hash % materialTypes.length] + " (" + s + ")",
            materialTypes[(hash + 3 + index) % materialTypes.length],
            materialTypes[(hash + 5 + index) % materialTypes.length]
        ];
        
        return { subject: s, tips: tipsString, resources };
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
        recommendedMaterials: subjectList.map((s, index) => {
            const hash = getHash(s.toLowerCase().trim() || "x");
            return {
                subject: s,
                focusArea: focusAreas[(hash + index) % focusAreas.length],
                materials: [
                    materialTypes[(hash + 1) % materialTypes.length] + " for " + s,
                    materialTypes[(hash + 4) % materialTypes.length],
                    materialTypes[(hash + 7 + index) % materialTypes.length],
                    "Customized " + s + " Notes"
                ]
            }
        }),
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

You MUST return a JSON object ONLY matching this precise schema, and you MUST follow these strict uniqueness rules:
1. Under 'subjectStrategy.tips', you MUST provide exactly 3 to 4 distinct bullet points per subject. 
2. EVERY bullet point and EVERY material MUST be 100% unique per subject. NEVER copy-paste the same materials or tips across different subjects. No overlap is allowed.

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
      "tips": "string (EXACTLY 3-4 bullet points with newlines, ENTIRELY UNIQUE to this subject and not repeated for any other subject)",
      "resources": ["string (100% unique resources)"]
    }
  ],
  "recommendedMaterials": [
    {
      "subject": "string",
      "focusArea": "string",
      "materials": ["string (100% unique materials that don't match any other subject's materials)"]
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

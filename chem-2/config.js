/* أُنشئ بواسطة محرّر اللعبة */
window.GAME_CONFIG = {
  "title": "مغامرة الأسئلة المجنونة",
  "subtitle": "أجب صح لتنجو… وأخطئ لتتزحلق!",
  "description": "فريقان يتناوبان على الأسئلة. كل إجابة صحيحة تبعد الخطر، وكل خطأ يقرّبه.",
  "players": [
    {
      "name": "فريق الشجعان",
      "gender": "male",
      "skin": "#ffcf9f",
      "color": "#ff6b6b",
      "accessory": "cap",
      "expression": "confident"
    },
    {
      "name": "فريق النجوم",
      "gender": "female",
      "skin": "#e0a370",
      "color": "#8e5cf7",
      "accessory": "crown",
      "expression": "genius"
    }
  ],
  "options": {
    "genders": {
      "male": "ذكر",
      "female": "أنثى",
      "neutral": "محايد"
    },
    "skins": [
      "#ffcf9f",
      "#e0a370",
      "#b97a4b",
      "#7a4a2b",
      "#9be3a0",
      "#a8d8ff"
    ],
    "colors": [
      "#ff6b6b",
      "#ffd23f",
      "#2ec4b6",
      "#8e5cf7",
      "#3a86ff",
      "#ff9f1c"
    ],
    "accessories": {
      "none": "بدون",
      "glasses": "نظارة",
      "crown": "تاج",
      "cap": "قبعة",
      "bow": "فيونكة"
    },
    "expressions": {
      "confident": "الواثق",
      "genius": "العبقري",
      "naughty": "المشاغب",
      "confused": "المرتبك"
    },
    "scenes": {
      "slime": "جسر فوق بركة لزجة",
      "rock": "صخرة متدحرجة",
      "snake": "ثعبان لطيف"
    }
  },
  "game": {
    "questionCount": 6,
    "countChoices": [
      4,
      6,
      8
    ],
    "timeSeconds": 30,
    "timeChoices": [
      15,
      30,
      60
    ],
    "scene": "slime",
    "shuffle": false,
    "startSafety": 50,
    "safetyStep": 20,
    "wrongPenalty": 0,
    "steal": true,
    "stealPoints": 0.5,
    "stealSafety": 10,
    "sound": true
  },
  "jokers": {
    "hide2": {
      "count": 1,
      "label": "🧹 احذف إجابتين"
    },
    "time": {
      "count": 1,
      "seconds": 15,
      "label": "⏱ وقت إضافي"
    },
    "double": {
      "count": 1,
      "label": "✖2 نقاط مضاعفة"
    }
  },
  "messages": {
    "turn": "دور {name}",
    "correct": "أحسنت! ابتعد الخطر.",
    "wrong": "إجابة خاطئة… اقترب الخطر!",
    "stealAsk": "فرصة للسرقة! هل أجاب {name} بشكل صحيح؟",
    "bothWrong": "أخطأ الفريقان!",
    "stealWin": "سرقة ناجحة!",
    "timeUp": "انتهى الوقت!",
    "win": "{name} نجا بطلاً!",
    "tie": "تعادل! نجا الجميع 🎉",
    "lose": "{name} هبط على كومة وسائد ناعمة!",
    "status": [
      {
        "min": 80,
        "icon": "🌟",
        "text": "نجا بأعجوبة"
      },
      {
        "min": 50,
        "icon": "🙂",
        "text": "بطلنا متوازن"
      },
      {
        "min": 25,
        "icon": "⚠️",
        "text": "اقتربت الخطورة!"
      },
      {
        "min": 0,
        "icon": "🆘",
        "text": "يحتاج إلى إنقاذ"
      }
    ]
  },
  "palette": {
    "bg": "linear-gradient(135deg,#2ec4b6 0%,#8e5cf7 55%,#ff6b6b 100%)",
    "card": "#ffffff",
    "ink": "#2b1b4d",
    "accent": "#ffd23f",
    "ok": "#12b76a",
    "no": "#f04438"
  },
  "questions": [
    {
      "type": "tf",
      "cat": "",
      "q": "الحجم الذي يشغله المول من غاز الهيدروجين يساوي الحجم الذي يشغله المول من غاز الأكسجين ( 16 = 0 ) عند قياس هذه الحجوم في نفس الظروف من الضغط والحرارة (H = 1)",
      "points": 10,
      "note": "",
      "correct": true
    },
    {
      "type": "tf",
      "cat": "",
      "q": "يشغل (0.25mol) من غاز الهيدروجين في الظروف القياسية حجما قدره (0.25L)",
      "points": 10,
      "note": "",
      "correct": false
    },
    {
      "type": "tf",
      "cat": "",
      "q": "المول الواحد من الغاز المثالي يشغل في الظروف القياسية حجما قدره ( 22.4L )",
      "points": 10,
      "note": "",
      "correct": true
    },
    {
      "type": "tf",
      "cat": "",
      "q": "يتناسب حجم كمية معينة من الغاز تناسبا طرديا مع عدد مولاته عند ثبوت كل من ( T, P )",
      "points": 10,
      "note": "",
      "correct": true
    },
    {
      "type": "tf",
      "cat": "",
      "q": "عند زيادة كمية غاز الهيليوم في وعاء حجمه ثابت يحتوى خليط من غازي الهيليوم والنيتروجين عند درجة حرارة ثابتة فإن الضغط الجزئي لغاز النيتروجين يزداد",
      "points": 10,
      "note": "",
      "correct": false
    },
    {
      "type": "tf",
      "cat": "",
      "q": "ادا كان الضغط الجزئي لغاز النيون (100Kpa) والضغط الكلي في وعاء يحتوي على خليط من الغازات يساوي (300Kpa) فإن الضغط الجزئي للغازات الاخرى يساوي (200Kpa)",
      "points": 10,
      "note": "",
      "correct": true
    }
  ]
};

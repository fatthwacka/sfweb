# Claude User Tips: Staying Within Project Guidelines

## 🎯 **Purpose**
This document provides practical tips for users to help Claude Code stay within project guidelines and follow established rules consistently.

---

## 🛡️ **Rule Enforcement Strategies**

### **A. Session Startup Protocol**

**Start EVERY session with rule reminders:**
```
"Before we begin: Remember our core rules:
- Zero inline CSS (no style={{}} props)
- Zero hardcoding (use config/constants only)  
- Zero mock data (use real data sources)
- Follow GradientBackground pattern exactly
- If you can't follow a rule, ask me first - don't deviate"
```

### **B. Pre-Implementation Checkpoints**

**Before Claude writes any code, ask:**
```
"Before implementing, please run through the MANDATORY VALIDATION CHECKPOINTS in CLAUDE.md and confirm:
- Are you using ANY style={{}} props?
- Are you hardcoding ANY values?
- Are you creating mock/placeholder data?
- Does this match working homepage sections exactly?"
```

### **C. Escalation Triggers**

**When Claude faces constraints, require explicit escalation:**
```
"If you encounter ANY technical constraints that would require breaking our rules:
1. STOP immediately
2. Explain the constraint clearly
3. Propose 2-3 rule-compliant alternatives
4. Wait for my approval before proceeding"
```

---

## 🔍 **Validation Techniques**

### **A. Reference Point Validation**

**Always reference working examples:**
```
"This needs to work exactly like the Services section on homepage. 
Please check services-overview.tsx and copy that pattern exactly."
```

### **B. Checkpoint Questions**

**Ask specific validation questions:**
- "Show me where this CSS class is defined"
- "Where is this data coming from - is it hardcoded?"
- "How does this compare to the working homepage pattern?"

### **C. Code Review Triggers**

**Request reviews at key points:**
```
"Before you continue, show me the component structure you're planning.
I want to verify it follows our established patterns."
```

---

## 📋 **Session Management Tips**

### **A. Context Persistence**

**Remind Claude of rules during long sessions:**
```
"We're getting deep into implementation. Let's pause and verify:
Are we still following our zero inline CSS rule?
Is everything using established patterns?"
```

### **B. Rule Reinforcement**

**When you see violations starting:**
```
"I see you're starting to use inline styles. Remember our rule:
ZERO inline CSS. Use CSS classes only. If classes don't exist, 
ask me to add them to index.css following existing patterns."
```

### **C. Course Correction**

**When Claude drifts off course:**
```
"This is deviating from our established patterns. 
Please STOP and refer back to the working homepage sections.
Copy their architecture exactly."
```

---

## 🎪 **Communication Templates**

### **A. Rule Reminder Templates**

**Core Rules Reminder:**
```
"Quick reminder of our non-negotiables:
❌ No style={{}} props - CSS classes only
❌ No hardcoded values - config sources only  
❌ No mock data - real data only
❌ No architectural variations - established patterns only"
```

**Pattern Reference Template:**
```
"This should work exactly like [specific working example].
Please study [component file] and copy its architecture exactly."
```

### **B. Constraint Escalation Templates**

**When Claude hits limitations:**
```
"I understand you're facing a constraint. Here's what I need:
1. Clearly explain what rule you can't follow and why
2. Show me the specific technical limitation
3. Propose 2-3 alternatives that DO follow our rules
4. Wait for my decision before proceeding"
```

### **C. Quality Check Templates**

**Mid-implementation validation:**
```
"Before we continue, let's validate:
- Show me 3 lines of your code that prove you're following our CSS class rule
- Point to the config source for each piece of data you're using
- Explain how this matches the working homepage pattern"
```

---

## 🔄 **Workflow Best Practices**

### **A. Iterative Validation**

**Break complex tasks into validated chunks:**
```
"Let's implement this in steps:
Step 1: Show me the component structure (no implementation)
Step 2: Show me the data source integration (verify it's not hardcoded)
Step 3: Show me the CSS class usage (verify no inline styles)
I'll approve each step before you continue."
```

### **B. Pattern Verification**

**Always compare to working examples:**
```
"Show me side-by-side comparison:
Left: Your proposed implementation
Right: The working services-overview.tsx pattern
Explain how they match exactly."
```

### **C. Rule Documentation**

**When new scenarios arise:**
```
"This is a new scenario. Before implementing:
1. Update CLAUDE.md with how to handle this case
2. Show me the updated documentation
3. Get my approval for the new pattern
4. Then implement following the new documented approach"
```

---

## ⚡ **Emergency Interventions**

### **A. Stop Phrases**

**When you see rule violations in progress:**
- "STOP - I see inline CSS being used"
- "STOP - That looks like hardcoded data"
- "STOP - This doesn't match our established pattern"

### **B. Reset Phrases**

**When Claude has drifted too far:**
```
"Let's reset. Go back to the working homepage sections:
1. Read services-overview.tsx
2. Identify the exact pattern it uses
3. Copy that pattern for our new implementation
4. Show me the copied structure before adding any custom logic"
```

### **C. Rule Reinforcement**

**When violations keep happening:**
```
"I'm seeing repeated rule violations. Let's establish a checkpoint system:
Before writing ANY code, you must:
1. State which rule you're following
2. Reference which working component you're copying
3. Get my approval for the approach
Only then can you implement."
```

---

## 📊 **Success Metrics**

### **How to Know It's Working:**

✅ **Claude asks before deviating** instead of implementing variations  
✅ **Claude references working examples** before implementing  
✅ **Claude uses escalation templates** when facing constraints  
✅ **Claude validates against rules** before writing code  
✅ **Code reviews show zero rule violations**  

### **Warning Signs to Watch For:**

❌ **Claude jumps straight to implementation** without validation  
❌ **Claude justifies rule violations** with technical reasons  
❌ **Claude creates custom solutions** without asking  
❌ **Code contains style={{}} props or hardcoded values**  
❌ **Implementation differs significantly** from working examples  

---

## 🎯 **Quick Reference Commands**

### **Session Starters:**
- `"Rule reminder: Zero inline CSS, zero hardcoding, zero mock data"`
- `"Reference point: Copy services-overview.tsx pattern exactly"`
- `"Escalation required: Ask me before breaking any rules"`

### **Mid-Session Checks:**
- `"Checkpoint: Run through validation checklist"`
- `"Pattern check: How does this match homepage sections?"`
- `"Rule check: Show me you're following CSS class rule"`

### **Course Corrections:**
- `"STOP: Rule violation detected"`
- `"RESET: Go back to working examples"`
- `"ESCALATE: Ask for guidance instead of deviating"`

---

## 💡 **Pro Tips**

1. **Be Specific**: Reference exact files and line numbers when pointing to patterns
2. **Use Visual Cues**: 🛑 and ❌ symbols get attention better than plain text
3. **Require Explicit Confirmation**: Make Claude state the rule they're following
4. **Break Down Complex Tasks**: Validate each step instead of full implementations
5. **Document New Patterns**: When edge cases arise, update guidelines immediately

**Remember: Consistent enforcement is key. Every violation that goes uncorrected teaches Claude that rules are negotiable.**
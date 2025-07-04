# Logic Document: Smart Assign & Conflict Resolution

## Smart Assign Implementation

### The Problem
In team environments, tasks often get assigned unevenly - some people end up overloaded while others have lighter workloads. Manual assignment requires knowing everyone's current capacity, which is tedious and error-prone.

### My Solution
I built a Smart Assign feature that automatically distributes tasks to the least busy team member. Here's how it works:

**The Logic:**
1. When someone clicks "Smart Assign" on a task, the system queries the database to count active tasks for each user
2. It only counts tasks that aren't marked as "Done" - completed work shouldn't affect new assignments
3. The system finds the user with the lowest task count
4. The task gets automatically assigned to that person
5. Everyone gets notified through the activity feed

**Why This Works:**
- **Fair Distribution**: New team members automatically get tasks since they start with zero
- **Dynamic Balancing**: As people complete tasks, they become available for new assignments
- **Simple Logic**: Easy to understand and debug - no complex algorithms needed
- **Real-time**: Works with current data, not outdated snapshots

**Real Example:**
- Alice has 3 active tasks
- Bob has 1 active task  
- Carol just joined (0 tasks)
- Smart Assign picks Carol, then Bob, then Alice

### Edge Cases Handled
- What if no users exist? → Error message returned
- What if multiple users have same count? → Database returns first one (consistent)
- What if someone completes tasks while assigning? → Uses current data at assignment time

---

## Conflict Resolution System

### The Problem
The biggest challenge in collaborative apps is when two people edit the same thing simultaneously. Most apps either:
- Lose someone's changes (bad user experience)
- Create duplicates (data corruption)
- Show confusing error messages (frustrating)

### My Solution: Version-Based Conflict Detection

**How It Works:**
Every task has a hidden "version" number that increases each time it's updated. When someone tries to save changes, I check if their version matches the current database version.

**The Process:**
1. **User A** opens task "Fix login bug" (version 1)
2. **User B** opens the same task (version 1)
3. **User A** changes title to "Fix authentication issue" and saves
4. Database updates task to version 2
5. **User B** tries to save their description changes (still thinks it's version 1)
6. System detects mismatch: submitted version 1 ≠ current version 2
7. Instead of failing silently, show conflict resolution options

### Conflict Resolution Options

When a conflict is detected, the user gets three clear choices:

**1. Use Server Version**
- "Someone else made changes while you were editing"
- Discards your changes, keeps what's currently saved
- Safe option when you're not sure

**2. Use Your Version** 
- "I want to keep my changes and overwrite theirs"
- Replaces server data with your local changes
- Good when you know your changes are more important

**3. Merge Changes**
- "Let me pick and choose from both versions"
- Shows side-by-side comparison of each field
- User manually selects which version of each field to keep
- Most flexible but requires more thought

### Real-World Example

**Scenario:** Two developers editing the same bug report

1. **Sarah** opens task: "Login broken" (version 1)
2. **Mike** opens same task (version 1)
3. **Sarah** changes title to "Authentication system failing" and saves
4. **Mike** adds detailed description and tries to save
5. **Conflict detected!** Mike sees:
   - **Server version:** "Authentication system failing" (Sarah's title)
   - **Your version:** "Login broken" (Mike's original) + detailed description
6. **Mike chooses "Merge":**
   - Title: Uses Sarah's "Authentication system failing"
   - Description: Uses his detailed description
   - Result: Best of both changes preserved

### Why This Approach Works

**Prevents Data Loss:** No changes disappear without user knowledge
**User Control:** People decide how to resolve conflicts, not the system
**Transparency:** Users see exactly what changed and when
**Better UX:** Clear options instead of cryptic error messages
**Data Integrity:** Version numbers ensure consistency

### Technical Benefits
- **Atomic Operations:** Each update is a single database transaction
- **Race Condition Safe:** Version checking happens at database level
- **Audit Trail:** All changes logged with timestamps and user info
- **Rollback Capable:** Could implement undo functionality later

This system turns a frustrating technical problem into a manageable user experience where people stay in control of their work.
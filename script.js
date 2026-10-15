/* WorkSmart AI prototype: browser-only, rule-based demo. No live AI API is connected. */
const $ = (id) => document.getElementById(id);
let tasks = [];
let emailCount = 0;
let meetingCount = 0;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function navigate(target) {
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === target));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.target === target));
  const active = document.querySelector(`.nav-item[data-target="${target}"]`);
  $("current-crumb").textContent = active ? active.innerText.trim() : target;
  window.scrollTo({top:0, behavior:"smooth"});
}
document.querySelectorAll("[data-target]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.target)));

$("make-email").addEventListener("click", () => {
  const purpose = $("email-purpose").value.trim();
  const recipient = $("email-recipient").value.trim() || "Team";
  const tone = $("email-tone").value;
  const details = $("email-details").value.trim();
  if (!purpose) return showToast("Please describe the purpose of the email.");
  const greeting = tone === "Friendly" ? `Hi ${recipient},` : tone === "Formal" ? `Dear ${recipient},` : `Hello ${recipient},`;
  const closing = tone === "Concise" ? "Regards," : tone === "Friendly" ? "Thanks so much," : "Kind regards,";
  const output = `Subject: ${purpose}\n\n${greeting}\n\nI am writing regarding ${purpose.charAt(0).toLowerCase()+purpose.slice(1)}.${details ? "\n\nKey details:\n"+details : ""}\n\nPlease let me know if you have any questions or need any additional information.\n\n${closing}\n[Your name]`;
  $("email-output").textContent = output;
  $("email-result").classList.remove("hidden");
  emailCount++; $("email-count").textContent = emailCount;
});

$("make-summary").addEventListener("click", () => {
  const title = $("meeting-title").value.trim() || "Meeting";
  const raw = $("meeting-notes").value.trim();
  if (!raw) return showToast("Please add some meeting notes first.");
  const lines = raw.split(/\n|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  const actions = lines.filter(s => /\b(action|follow.?up|will |need to|deadline|owner|assign|by friday|next step|responsible)\b/i.test(s));
  const summary = `MEETING: ${title}\n\nSUMMARY\n${lines.slice(0,4).map(s=>"• "+s).join("\n")}\n\nPOTENTIAL ACTION ITEMS\n${(actions.length ? actions : lines.slice(0,3)).map(s=>"• "+s).join("\n")}\n\nNEXT STEP\nConfirm owners and deadlines for each action item.\n\nNote: This prototype organises supplied text; review the summary for accuracy.`;
  $("meeting-output").textContent = summary;
  $("meeting-result").classList.remove("hidden");
  meetingCount++; $("meeting-count").textContent = meetingCount;
});

$("task-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("task-name").value.trim();
  if (!name) return;
  tasks.push({id:Date.now(),name,priority:$("task-priority").value,due:$("task-due").value,done:false});
  $("task-name").value = ""; renderTasks();
});
function renderTasks() {
  $("task-count").textContent = tasks.length;
  $("task-summary").textContent = `${tasks.filter(t=>t.done).length} of ${tasks.length} completed`;
  const list = $("task-list");
  if (!tasks.length) { list.innerHTML = '<div class="empty-state">Your tasks will appear here.</div>'; return; }
  const order = {High:0,Medium:1,Low:2};
  list.innerHTML = [...tasks].sort((a,b)=>order[a.priority]-order[b.priority]).map(t=>`
    <div class="task-row ${t.done?"done":""}">
      <input type="checkbox" aria-label="Mark task complete" data-done="${t.id}" ${t.done?"checked":""}>
      <span class="task-title">${escapeHtml(t.name)}${t.due?`<br><small class="muted">Due ${escapeHtml(t.due)}</small>`:""}</span>
      <span class="priority ${t.priority}">${t.priority}</span>
      <button class="delete-task" data-delete="${t.id}" aria-label="Delete task">×</button>
    </div>`).join("");
  list.querySelectorAll("[data-done]").forEach(el=>el.addEventListener("change",()=>{const t=tasks.find(x=>x.id===Number(el.dataset.done));if(t)t.done=el.checked;renderTasks();}));
  list.querySelectorAll("[data-delete]").forEach(el=>el.addEventListener("click",()=>{tasks=tasks.filter(t=>t.id!==Number(el.dataset.delete));renderTasks();}));
}

$("make-research").addEventListener("click", () => {
  const topic = $("research-topic").value.trim();
  const raw = $("research-text").value.trim();
  if (!topic) return showToast("Please enter a research topic or question.");
  let output = `RESEARCH BRIEF\nTopic: ${topic}\n\nRESEARCH QUESTIONS\n• What are the main concepts and current practices related to this topic?\n• What evidence supports the different approaches?\n• What are the benefits, risks, and limitations?\n\nSUGGESTED APPROACH\n1. Search credible and up-to-date sources.\n2. Compare evidence from more than one source.\n3. Record source details and note any uncertainty.\n4. Summarise findings in your own words.\n\n`;
  if (raw) {
    const sentences = raw.split(/(?<=[.!?])\s+|\n/).map(s=>s.trim()).filter(Boolean);
    output += `SUMMARY OF PROVIDED TEXT\n${sentences.slice(0,5).map(s=>"• "+s).join("\n")}\n\n`;
  }
  output += "LIMITATION\nThis is a research planning prototype. It does not browse the web or independently verify facts. Confirm all claims against reliable sources.";
  $("research-output").textContent = output;
  $("research-result").classList.remove("hidden");
});

function addChatMessage(text, role) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  const label = document.createElement("strong");
  label.textContent = role === "user" ? "You" : "WorkSmart assistant";
  const p = document.createElement("p");
  p.textContent = text;
  bubble.append(label,p); $("chat-messages").appendChild(bubble);
  $("chat-messages").scrollTop = $("chat-messages").scrollHeight;
}
function chatReply(question) {
  const q = question.toLowerCase();
  if (/email|write|draft/.test(q)) return "Start by identifying the recipient, purpose, desired tone, and key details. Keep the message clear, polite, and focused. Review the draft before sending.";
  if (/time|priorit|deadline|organis/.test(q)) return "List your tasks, note each deadline, and identify the most important or time-sensitive items. Break large tasks into smaller steps and schedule focused work time. Reassess priorities when plans change.";
  if (/meeting|summari|notes/.test(q)) return "Capture the meeting goal, key discussion points, decisions, action owners, and deadlines. Share the summary with attendees so they can correct anything inaccurate.";
  if (/research|source|fact/.test(q)) return "Turn your topic into a focused question. Use credible, current sources, compare evidence, track citations, and verify important claims. This prototype does not search the web automatically.";
  if (/privacy|confidential|safe|ethic/.test(q)) return "Avoid entering passwords, personal data, or confidential company information. Check generated content for accuracy and bias, follow your workplace policies, and keep a human responsible for final decisions.";
  return "A useful approach is to define the goal, provide relevant non-sensitive context, specify the format you want, and review the result. Try asking about email writing, meeting notes, task prioritisation, or responsible AI. This is a rule-based prototype, not a live AI model.";
}
$("chat-form").addEventListener("submit", e => {
  e.preventDefault();
  const question = $("chat-input").value.trim();
  if (!question) return;
  addChatMessage(question,"user");
  $("chat-input").value = "";
  addChatMessage(chatReply(question),"assistant");
});
document.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", async () => {
  const text = $(button.dataset.copy).textContent;
  try { await navigator.clipboard.writeText(text); showToast("Copied to clipboard."); }
  catch { showToast("Select the result text and copy it manually."); }
}));

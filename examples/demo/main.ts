import { createAssistant, createScriptedProvider } from "../../src/index";

/**
 * The demo runs fully offline with a scripted provider. To use a real model,
 * swap it for e.g. createAnthropicProvider({ apiKey }) or createProxyProvider({ url }).
 */
const provider = createScriptedProvider(
  [
    {
      match: /invite|teammate|add (a )?(user|member)/i,
      answer: {
        message: "Inviting a teammate takes three quick steps:",
        steps: [
          { target: "#invite-email", title: "Enter their email", instruction: "Type your teammate's work email address." },
          { target: "#invite-role", title: "Pick a role", instruction: "Choose Member, Admin or Viewer. You can change it later." },
          { target: "#send-invite", title: "Send the invite", instruction: "Click Send invite and they'll get an email right away." },
        ],
      },
    },
    {
      match: /project|create|start/i,
      answer: {
        message: "Here's how to start a new project:",
        steps: [
          { target: "#new-project", title: "Create it", instruction: "Click New project to open the project wizard." },
          { target: "#search", title: "Find it later", instruction: "Use search any time to jump back to a project by name." },
        ],
      },
    },
    {
      match: /export|report|download/i,
      answer: {
        message: "You can export a report from the toolbar.",
        steps: [{ target: "#export-btn", title: "Export report", instruction: "Click Export report and choose CSV or PDF." }],
      },
    },
    {
      match: /bill|invoice|plan|pay/i,
      answer: {
        message: "Billing lives in the sidebar.",
        steps: [{ target: "#nav-billing", title: "Open Billing", instruction: "Click Billing to see invoices and change your plan." }],
      },
    },
  ],
  { message: "I can help with projects, inviting teammates, reports and billing.", steps: [] },
);

createAssistant({
  provider,
  productName: "Acme",
  suggestions: ["How do I invite a teammate?", "How do I create a project?", "Where is billing?"],
  guides: [
    {
      id: "tour",
      title: "Quick tour",
      description: "Here's a 30-second tour of the essentials.",
      steps: [
        { target: "#new-project", title: "Start here", instruction: "Create your first project with this button." },
        { target: "#export-btn", title: "Share results", instruction: "Export a report to share with stakeholders." },
        { target: "#send-invite", title: "Bring your team", instruction: "Invite teammates so you can collaborate." },
      ],
    },
  ],
});

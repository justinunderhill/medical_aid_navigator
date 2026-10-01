# Privacy Principles (POPIA-aware)

_Last reviewed: 2026-10. Source: app information-handling design._

This MVP is built around data minimisation.

Please do not submit:
- ID numbers
- Medical aid membership numbers
- Full medical history or clinical records
- Payment card data
- Exact home address

We may process (only to give you guidance, not stored against your identity):
- The scenario you select
- The optional free text you type
- Optional scheme/plan name if you choose to enter it
- Your questions and recent conversation with MAN
- A benefits PDF, if you choose to attach one

MAN keeps the conversation and selected PDF in this browser tab's memory so you
can move between app pages. Refreshing the page or clearing the chat removes
them. Attaching a different plan or removing the plan starts a new conversation.

To answer a question, the app sends the latest question and up to six recent
exchanges to its configured AI provider. With a plan attached, it also sends the
PDF to Anthropic for each answer. The app does not save these inputs to a database,
browser storage, or application logs. Processing by the AI provider is subject to
that provider's terms and retention policies; this is not a promise of immediate
deletion by the provider. Upload a benefits guide rather than personal clinical
records, and remove identifiers before sharing a document.

No account is required to use the tool. If we ever store an input, we will ask
for clear consent first.

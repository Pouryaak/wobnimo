/* The conversation column: what the person said, and for each request a
   build card that fills in as the generator works (its notes, the plan,
   the check, and finally the reply with a few follow-ups to tap). */

import type { Hex } from '@wobnimo/engine';
import type { CheckReport } from '@wobnimo/engine/check';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

export class Chat {
  constructor(private readonly log: HTMLElement) {}

  /** Adds what the person wrote. */
  said(text: string) {
    const msg = el('div', 'msg msg-user');
    msg.append(el('p', '', text));
    this.append(msg);
  }

  /** Starts the card for one build. */
  build(label: string): BuildCard {
    const card = new BuildCard(label);
    this.append(card.root);
    return card;
  }

  clear() {
    this.log.querySelectorAll('.msg').forEach((m) => m.remove());
  }

  private append(node: HTMLElement) {
    this.log.append(node);
    this.follow();
  }

  /** Keeps the newest line in view while it is being written. */
  follow() {
    this.log.scrollTo({ top: this.log.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

export class BuildCard {
  readonly root = el('article', 'msg msg-build is-working');
  private readonly lines = el('ol', 'build-lines');
  private readonly body = el('div', 'build-body');
  private readonly foot = el('div', 'build-body');
  private onChange: () => void = () => {};

  constructor(label: string) {
    const head = el('header', 'build-head');
    head.append(el('span', 'build-mark'), el('b', '', 'Studio'), el('span', 'build-label mono', label));
    this.root.append(head, this.body, this.lines, this.foot);
    this.root.setAttribute('aria-busy', 'true');
  }

  /** Called after every change, so the log can scroll along. */
  set changed(fn: () => void) {
    this.onChange = fn;
  }

  /** A line in the build log. The newest one is "now"; older ones settle. */
  line(text: string, kind: 'note' | 'add' | 'ok' | 'warn' | 'err' = 'note') {
    this.lines.querySelector('.now')?.classList.remove('now');
    const li = el('li', `line-${kind}${kind === 'note' ? ' now' : ''}`, text);
    this.lines.append(li);
    this.onChange();
  }

  /** The idea, before any shape: a name, one line, and the colours it will wear. */
  plan(name: string, summary: string, colors: Hex[]) {
    const plan = el('div', 'build-plan');
    const swatches = el('span', 'plan-swatches');
    for (const c of colors) {
      const sw = el('i');
      sw.style.setProperty('--c', c);
      swatches.append(sw);
    }
    plan.append(el('span', 'plan-kicker mono', 'Plan'), el('strong', 'plan-name', name), el('span', 'plan-summary', summary), swatches);
    this.body.append(plan);
    this.onChange();
  }

  /** The checker's verdict, with the first few findings. */
  check(report: CheckReport) {
    const errors = report.issues.filter((i) => i.level === 'error');
    const warnings = report.issues.filter((i) => i.level === 'warning');
    this.line(`${report.ok ? '✓' : '✖'} ${errors.length} errors · ${warnings.length} warnings · ${report.stats.parts} parts measured`, report.ok ? 'ok' : 'err');
    for (const issue of [...errors, ...warnings].slice(0, 3)) this.line(`${issue.where}: ${issue.message}`, issue.level === 'error' ? 'err' : 'warn');
  }

  /** The finished build: what the studio says, and follow-ups the person can tap. */
  reply(text: string, followUps: string[], pick: (prompt: string) => void) {
    this.settle();
    const p = el('p', 'build-reply', text);
    const chips = el('div', 'follow-ups');
    for (const f of followUps) {
      const b = el('button', 'chip', f);
      b.type = 'button';
      b.addEventListener('click', () => pick(f));
      chips.append(b);
    }
    this.foot.append(p, chips);
    this.onChange();
  }

  stopped() {
    this.settle();
    this.line('Stopped', 'warn');
  }

  failed(message: string) {
    this.settle();
    this.root.classList.add('is-failed');
    this.foot.append(el('p', 'build-reply', `That one didn't come together: ${message}`));
    this.onChange();
  }

  private settle() {
    this.root.classList.remove('is-working');
    this.root.removeAttribute('aria-busy');
    this.lines.querySelector('.now')?.classList.remove('now');
  }
}

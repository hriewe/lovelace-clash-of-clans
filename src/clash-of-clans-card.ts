import "./editor";
import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("clash-of-clans-card")
export class ClashOfClansCard extends LitElement {
  @property({ attribute: false }) public hass!: any;
  @property() public config!: any;

  // -------------------- Lovelace hooks --------------------

  static getConfigElement() {
    return document.createElement("clash-of-clans-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      show_progression: true,
      show_war: true,
    };
  }

  setConfig(config: any) {
    if (!config.entity) {
      throw new Error("You must select a Clash of Clans entity");
    }

    this.config = {
      show_progression: true,
      show_war: true,
      ...config,
    };
  }

  // -------------------- styles --------------------

  static styles = css`
    ha-card {
      padding: 16px;
      border-radius: 12px;
    }

    .header {
      margin-bottom: 16px;
    }

    .name {
      font-size: 1.4em;
      font-weight: bold;
    }

    .sub {
      color: var(--secondary-text-color);
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }

    .inline {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
    }

    .icon-fallback {
      display: none;
    }


    .level-icon {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }

    .section {
      margin-top: 16px;
    }

    .progress-row {
      display: flex;
      align-items: center;
      margin: 8px 0;
      gap: 8px;
    }

    .label {
      width: 70px;
      font-size: 0.9em;
    }

    .bar {
      flex: 1;
      height: 10px;
      background: var(--divider-color);
      border-radius: 6px;
      overflow: hidden;
    }

    .fill {
      height: 100%;
      background: var(--primary-color);
      transition: width 0.3s ease;
    }

    .value {
      width: 40px;
      text-align: right;
      font-size: 0.85em;
    }

    .war {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9em;
    }

    .muted {
      color: var(--secondary-text-color);
    }
  `;

  // -------------------- helpers --------------------

  private get baseEntity(): any {
    return this.hass.states[this.config.entity];
  }

  private get playerTag(): string | null {
    const attrs = this.baseEntity?.attributes;
    return attrs?.player_tag ?? null;
  }

  private get relatedEntities(): any[] {
    const states = Object.values(this.hass.states);

    if (this.playerTag) {
      return states.filter((e: any) => e.attributes?.player_tag === this.playerTag);
    }

    return states;
  }

  private entityBySuffix(suffix: string): any {
    return this.relatedEntities.find((e: any) =>
      e.entity_id.endsWith(suffix)
    );
  }

  private getAssetUrl(path: string): string {
    // Use HACS path for production, local path for development
    const hacsPath = `/hacsfiles/lovelace-clash-of-clans/${path}`;
    const localPath = new URL(path, new URL(".", import.meta.url)).toString();
    
    // Check if we're running in HACS environment
    if (window.location.href.includes('/hacsfiles/') || 
        document.querySelector('script[src*="/hacsfiles/lovelace-clash-of-clans/"]')) {
      return hacsPath;
    }
    
    return localPath;
  }

  private renderIcon(fileName: string, fallbackEmoji: string): TemplateResult {
    const src = this.getAssetUrl(fileName);
    // For local development
    //const src = this.getAssetUrl(`assets/${fileName}`);

    return html`
      <span class="icon-wrap">
        <img
          class="level-icon"
          src=${src}
          alt=""
          @error=${(ev: Event) => {
            const img = ev.target as HTMLImageElement;
            img.style.display = "none";
            const wrap = img.parentElement;
            const fallback = wrap?.querySelector(".icon-fallback") as HTMLElement | null;
            if (fallback) fallback.style.display = "inline";
          }}
        />
        <span class="icon-fallback">${fallbackEmoji}</span>
      </span>
    `;
  }

  private get showProgression(): boolean {
    return this.config?.show_progression !== false;
  }

  private get showWar(): boolean {
    return this.config?.show_war !== false;
  }

  private formatRelativeDate(dateValue: any): string {
    if (!dateValue || dateValue === "unknown") return "—";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue);

    const diffMs = date.getTime() - Date.now();
    const absMs = Math.abs(diffMs);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    let rel: string;
    if (absMs >= 24 * 60 * 60 * 1000) {
      rel = rtf.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");
    } else if (absMs >= 60 * 60 * 1000) {
      rel = rtf.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");
    } else if (absMs >= 60 * 1000) {
      rel = rtf.format(Math.round(diffMs / (60 * 1000)), "minute");
    } else {
      rel = rtf.format(Math.round(diffMs / 1000), "second");
    }

    const local = date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return `${rel} (${local})`;
  }

  private _handleTap(): void {
  const event = new CustomEvent("hass-action", {
    detail: {
      config: this.config,
      action: "more-info",
      entity: this.config.entity,
    },
    bubbles: true,
    composed: true,
  });
  this.dispatchEvent(event);
}

  // -------------------- render helpers --------------------

  private renderProgress(label: string, suffix: string): TemplateResult | null {
    const entity = this.entityBySuffix(suffix);
    if (!entity || entity.state === "unknown") return null;

    const value = Number(entity.state);
    if (isNaN(value)) return null;

    return html`
      <div class="progress-row">
        <div class="label">${label}</div>
        <div class="bar">
          <div class="fill" style="width: ${value}%"></div>
        </div>
        <div class="value">${value}%</div>
      </div>
    `;
  }

  // -------------------- sections --------------------

  private renderHeader(): TemplateResult {
    const info = this.baseEntity;
    if (!info) {
      return html`<div class="muted">Player not found</div>`;
    }

    const rawLeague = info.attributes.league ?? "Unranked";
    const leagueSlug = rawLeague.toLowerCase().split(' ')[0];
    const leagueIconFile = leagueSlug === "unranked" ? "unranked.png" : `${leagueSlug}.png`;

    const xp =
      this.entityBySuffix("_xp_level")?.state ??
      info.attributes?.experience_level ??
      "—";

    const thLevel = this.entityBySuffix("_town_hall_level")?.state;
    const bhLevel = this.entityBySuffix("_builder_hall_level")?.state;
    const trophies = this.entityBySuffix("_trophies")?.state ?? "—";

    return html`
      <div class="header">
        <div class="name">${info.state}</div>

        <div class="sub">
          <span class="inline">
            ${this.renderIcon(leagueIconFile, "🏆")} 
            ${rawLeague}
          </span>
          •
          <span class="inline">
            ${this.renderIcon("trophy.png", "🏆")} ${trophies}
          </span>
        </div>

  <div class="sub">
          <span class="inline">
            ${this.renderIcon(`th${thLevel}.png`, "🏠")}
            TH ${thLevel ?? "—"}
          </span>
          •
          <span class="inline">
            ${this.renderIcon(`bh${bhLevel}.png`, "🏗")}
            BH ${bhLevel ?? "—"}
          </span>
          •
          <span class="inline">
            ${this.renderIcon("xp.png", "⭐")} XP ${xp}
          </span>
        </div>
      </div>
    `;
  }

  private renderProgression(): TemplateResult {
    if (!this.showProgression) return html``;

    return html`
      <div class="section">
        <strong>Progression</strong>
        ${this.renderProgress("Troops", "_troop_pet_progression")}
        ${this.renderProgress("Spells", "_spell_progression")}
        ${this.renderProgress("Heroes", "_hero_progression")}
      </div>
    `;
  }

  private renderWar(): TemplateResult | null {
    if (!this.showWar) return null;

    const state = this.entityBySuffix("_current_war_state");
    if (!state) return null;

    const rawState = state.state;
    const displayState =
      rawState === "unknown" ? "No war declared" :
      rawState === "inWar" ? "Battle Day" :
      rawState === "preparation" ? "Preparation Day" :
      rawState === "warEnded" ? "War Ended" :
      rawState === "notInWar" ? "Not in war" :
      rawState;

    const end = this.entityBySuffix("_current_war_end_time")?.state;
    const attacksRemaining = this.entityBySuffix("_war_attacks_remaining")?.state;
    const showAttacksRow =
      rawState === "inWar" &&
      attacksRemaining !== undefined &&
      attacksRemaining !== null &&
      attacksRemaining !== "unknown";

    return html`
      <div class="section">
        <strong>Clan War</strong>
        <div class="war">
          <div class="inline">
            ${this.renderIcon("clanwar.png", "⚔️")} 
            <span>${displayState}</span>
          </div>
          
          ${showAttacksRow
            ? html`<div>Attacks Left: ${attacksRemaining}</div>`
            : html``}
          ${rawState === "unknown" || rawState === "notInWar"
            ? html``
            : html`<div class="muted">Ends: ${this.formatRelativeDate(end)}</div>`}
        </div>
      </div>
    `;
  }

  // -------------------- main render --------------------

  render() {
    if (!this.hass || !this.config) return html``;

    return html`
      <ha-card @click=${this._handleTap}>
        ${this.renderHeader()}
        ${this.renderProgression()}
        ${this.renderWar()}
      </ha-card>
    `;
  }
}

// -------------------- card registration --------------------

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "clash-of-clans-card",
  name: "Clash of Clans Card",
  description: "Display Clash of Clans player progression and war status",
});

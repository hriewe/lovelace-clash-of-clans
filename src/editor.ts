import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("clash-of-clans-card-editor")
export class ClashOfClansCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: any;
  @property({ attribute: false }) private _config: any;

  private get _infoEntities(): string[] {
    if (!this.hass?.states) return [];

    return Object.keys(this.hass.states).filter((entityId) => {
      if (!entityId.startsWith("sensor.")) return false;
      if (!entityId.endsWith("_info")) return false;
      const stateObj = this.hass.states[entityId];
      return Boolean(stateObj?.attributes?.player_tag);
    });
  }

  setConfig(config: any) {
    this._config = {
      show_progression: true,
      show_war: true,
      ...config,
    };
  }

  private _valueChanged(ev: Event) {
    if (!this._config || !this.hass) return;

    const value = (ev as CustomEvent).detail?.value;
    if (!value) return;

    const next = {
      ...this._config,
      ...value,
    };

    if (!next.entity) return;

    this._config = next;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{
          entity: this._config?.entity || "",
          show_progression: this._config?.show_progression !== false,
          show_war: this._config?.show_war !== false,
        }}
        .schema=${[
          {
            name: "entity",
            selector: {
              entity: {
                include_entities: this._infoEntities.length ? this._infoEntities : undefined,
              },
            },
          },
          {
            name: "show_progression",
            selector: {
              boolean: {},
            },
          },
          {
            name: "show_war",
            selector: {
              boolean: {},
            },
          },
        ]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}

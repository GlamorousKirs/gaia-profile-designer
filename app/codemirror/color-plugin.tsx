import { WidgetType, ViewPlugin, Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

class ColorWidget extends WidgetType {
  constructor(
    readonly color: string,
    readonly from: number,
    readonly to: number
  ) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-custom-color-trigger size-3 mr-1 inline-block rounded-full border border-border cursor-pointer vertical-align-middle select-none transition-all hover:scale-110";
    span.style.backgroundColor = this.color;

    span.setAttribute("data-color", this.color);
    span.setAttribute("data-from", this.from.toString());
    span.setAttribute("data-to", this.to.toString());
    span.setAttribute("contenteditable", "false");

    return span;
  }

  eq(other: ColorWidget) {
    return other.from === this.from && other.to === this.to && other.color === this.color;
  }
}

export const ColorPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDeco(view);
  }

  update(update: any) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDeco(update.view);
    }
  }

  buildDeco(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();
    const hexRegex = /#([a-fA-F0-9]{8}|[a-fA-F0-9]{6}|[a-fA-F0-9]{4}|[a-fA-F0-9]{3})/g;

    for (let { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to);
      let match;
      while ((match = hexRegex.exec(text)) !== null) {
        const start = from + match.index;
        const end = start + match[0].length;

        builder.add(start, start, Decoration.widget({
          widget: new ColorWidget(match[0], start, end),
          side: -1
        }));
      }
    }
    return builder.finish();
  }
}, { decorations: v => v.decorations });
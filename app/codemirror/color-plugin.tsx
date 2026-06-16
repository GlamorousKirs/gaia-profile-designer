import { WidgetType, ViewPlugin, Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { EditorColorPicker } from "@/components/EditorColorPicker";
import { createRoot, type Root } from "react-dom/client";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

class ColorWidget extends WidgetType {
  private root: Root | null = null;

  constructor(readonly color: string, readonly from: number, readonly to: number) {
    super();
  }

  toDOM(view: EditorView) {
    const span = document.createElement("span");
    span.className = "inline-flex items-center align-middle mx-1";
    
    this.root = createRoot(span);
    this.root.render(
      <EditorColorPicker
        initialColor={this.color}
        onCommit={(newColor) => {
          view.dispatch({
            changes: { from: this.from, to: this.to, insert: newColor }
          });
        }}
      />
    );

    return span;
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  eq(other: ColorWidget) {
    return other.color === this.color && other.from === this.from;
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
    
    // Pattern matches hex, rgb/a, hsl/a, and general words that could be color names
    const colorRegex = /#([0-9a-fA-F]{3,8})|([a-zA-Z]+)|(rgba?|hsla?)\([^)]*\)/g;

    for (let { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to);
      let match;
      while ((match = colorRegex.exec(text)) !== null) {
        const colorValue = match[0];
        
        // Use colord to validate if the matched string is a valid CSS color
        if (colord(colorValue).isValid()) {
          const start = from + match.index;
          const end = start + colorValue.length;
          
          builder.add(end, end, Decoration.widget({
            widget: new ColorWidget(colorValue, start, end),
            side: 1
          }));
        }
      }
    }
    return builder.finish();
  }
}, { decorations: v => v.decorations });
/** tweening **/
var rushInOut = (x) => {
    return 2.388 * x - 4.166 * Math.pow(x, 2) + 2.77 * Math.pow(x, 3);
};

// https://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
var cursorOffsetWithin = (element) => {
    let cursorOffset = 0;
    let doc = element.ownerDocument || element.document;
    let win = doc.defaultView || doc.parentWindow;
    let sel;

    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();

        if (sel.rangeCount > 0) {
            const range = win.getSelection().getRangeAt(0);
            const preCursortRange = range.cloneRange();

            preCursortRange.selectNodeContents(element);
            preCursortRange.setEnd(range.endContainer, range.endOffset);
            cursortOffset = preCursorRange.toString().length;
        }
    } else if ((sel = doc.selection) && sel.type != "Control") {
        const textRange = sel.createRange();
        const preCursorTextRange = doc.body.createTextRange();

        preCursorTextRange.moveToElementText(element);
        preCursorTextRange.setEndPoint("EndToEnd", textRange);
        cursorOffset = preCursorTextRange.text.length;
    }

    return cursorOffset;
};

var EditorCloset = {
    imageSrcPattern: /^https?:\/\/(?:localhost|127.0.0.1):\d+\/(.*)$/u,

    occlusionMode: false,
    occlusionEditorTarget: null,
    getOcclusionButton: () => document.getElementById("closetOcclude"),

    setActive: (target) => {
        EditorCloset.occlusionEditorTarget = target;
        EditorCloset.occlusionMode = true;
        EditorCloset.getOcclusionButton().classList.add("highlighted");
        pycmd("occlusionEditorActive");
    },

    setInactive: () => {
        EditorCloset.occlusionEditorTarget = null;
        EditorCloset.occlusionMode = false;
        EditorCloset.getOcclusionButton().classList.remove("highlighted");
        pycmd("occlusionEditorInactive");
    },

    setupOcclusionEditor: (closet, maxOcclusions) => {
        const fieldElements = [];
        const a = require("anki/NoteEditor");
        console.log(a);
        // forEditorField([], (field) => {
        //     fieldElements.push(field.editingArea.editable);
        // });

        const elements = ["[[makeOcclusions]]"].concat(...fieldElements);

        const acceptHandler = (_entry, internals) => (shapes, draw) => {
            const imageSrc = draw.image.src.match(
                EditorCloset.imageSrcPattern,
            )[1];

            const newIndices = [
                ...new Set(
                    shapes
                        .map((shape) => shape.labelText)
                        .map((label) =>
                            label.match(closet.patterns.keySeparation),
                        )
                        .filter((match) => match)
                        .map((match) => Number(match[2]))
                        .filter((maybeNumber) => !Number.isNaN(maybeNumber)),
                ),
            ];

            pycmd(`newOcclusions:${imageSrc}:${newIndices.join(",")}`);

            const shapeText = shapes
                .map((shape) =>
                    shape.toText(internals.template.parser.delimiters),
                )
                .join("\n");

            pycmd(`occlusionText:${shapeText}`);

            EditorCloset.clearOcclusionMode();
        };

        const setupOcclusionMenu = (menu) => {
            menu.splice(1, 0, {
                label: `<input
                    type="range"
                    min="1"
                    max="100"
                    value="${EditorCloset.maxHeightPercent}"
                    oninput="EditorCloset.handleMaxHeightChange(window.event)"
                />`,
                html: true,
            });

            return menu;
        };

        const existingShapesFilter = () => (shapeDefs, draw) => {
            const indices = [
                ...new Set(
                    shapeDefs
                        .map((shape) => shape[2])
                        .map((label) =>
                            label.match(closet.patterns.keySeparation),
                        )
                        .filter((match) => match)
                        .map((match) => Number(match[2]))
                        .filter((maybeNumber) => !Number.isNaN(maybeNumber)),
                ),
            ];

            const imageSrc = draw.image.src.match(
                EditorCloset.imageSrcPattern,
            )[1];
            pycmd(`oldOcclusions:${imageSrc}:${indices.join(",")}`);

            return shapeDefs;
        };

        const editorOcclusion = closet.browser.recipes.occlusionEditor({
            maxOcclusions,
            acceptHandler,
            setupOcclusionMenu,
            existingShapesFilter,
        });

        const filterManager = closet.FilterManager.make();
        const target = editorOcclusion(filterManager.registrar);

        filterManager.install(
            ...["rect", "recth", "rectr"].map((tagname) =>
                closet.browser.recipes.rect.hide({ tagname }),
            ),
        );

        closet.template.BrowserTemplate.makeFromNodes(elements).render(
            filterManager,
        );

        EditorCloset.setActive(target);
    },

    clearOcclusionMode: () => {
        const editingAreas = [];

        // forEditorField([], (field) => {
        //     const edit = field.editingArea;
        //     if (
        //         edit.editable.innerHTML.includes(
        //             '<div class="closet-occlusion-container">',
        //         )
        //     ) {
        //         editingAreas.push(edit);
        //     }
        // });

        EditorCloset.occlusionEditorTarget.dispatchEvent(new Event("reject"));

        editingAreas.forEach((field) => {
            pycmd(
                `key:${field.ord}:${getNoteId()}:${field.editable.fieldHTML}`,
            );
        });

        EditorCloset.setInactive();
    },

    // is what is called from the UI
    toggleOcclusionMode: (versionString, maxOcclusions) => {
        if (EditorCloset.occlusionMode) {
            EditorCloset.clearOcclusionMode();
        } else {
            import(`/__closet-${versionString}.js`).then(
                (closet) =>
                    EditorCloset.setupOcclusionEditor(
                        closet.closet,
                        maxOcclusions,
                    ),
                (error) => console.log("Could not load Closet:", error),
            );
        }
    },

    loadOcclusionCss: (css) => {
        // forEditorField([], (field) => {
        //     if (!field.hasAttribute("has-occlusion-style")) {
        //         const style = document.createElement("style");
        //         style.rel = "stylesheet";
        //         style.textContent = css;
        //         field.editingArea.shadowRoot.appendChild(style);

        //         field.setAttribute("has-occlusion-style", "");
        //     }
        // });
    },

    /**************** CLOSET MODE ****************/
    setClosetMode: (mode) => {
        document.getElementById("closetMode").selectedIndex = mode;
    },

    /**************** MAX HEIGHT *****************/
    handleMaxHeightChange: (event) => {
        EditorCloset.setMaxHeightPercent(Number(event.currentTarget.value));
    },

    maxHeightPercent: 0,
    setMaxHeightPercent: (value /* 1 <= x <= 100 */) => {
        const maxMaxHeight = globalThis.screen.height;
        const factor = rushInOut(value / 100);

        EditorCloset.maxHeightPercent = value;
        EditorCloset.setMaxHeight(factor * maxMaxHeight);
    },

    setMaxHeight: (value /* > 0 */) => {
        document.documentElement.style.setProperty(
            "--closet-max-height",
            `${value}px`,
        );
    },
};

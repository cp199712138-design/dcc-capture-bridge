# Editing Reference Scan

## Goal

This project is not a generic screenshot dialog.

The editing layer should follow the behavior patterns of modern AI editing canvases:

- draw a region
- erase the region
- clear only the region mask
- keep the source image in place
- update preview only inside the selected region

## Krea Realtime

What matters for us:

- left canvas as input, right pane as output
- Brush tool
- Eraser tool
- Upload image as reference
- shortcut-driven editing
- output updates from the current canvas state

Source:

- Krea Realtime docs
- Krea Edit docs

## Krea Edit

What matters for us:

- Change Region is a first-class editing mode
- user can brush a custom region
- user can also use rectangle select or auto mask
- generated result should stay tied to the selected area

This means our MVP should not fake "AI preview everywhere" when only a region is selected.

## Vectary 3D to Image

What matters for us:

- 3D canvas + optional reference images + prompt
- the 3D scene is a control input, not just a screenshot
- AI generation should preserve scene angle and structural evidence

This supports the long-term direction:

```text
DCC evidence
-> regional edit canvas
-> provider adapter
-> preview / variant output
```

## ComfyUI Mask Editor

What matters for us:

- Brush = draw mask
- Eraser = remove mask
- Clear = clear all drawn mask
- Save / Cancel are separate actions from Clear

This is important because "Clear" should not wipe the imported base image.

## Borrow Now

- Brush and Eraser as separate tools
- Clear mask only
- region-based preview
- image import as the main editing entry
- keyboard shortcuts for brush / eraser

## Defer

- Auto Mask
- rectangle select
- bucket fill
- color select
- multi-result history
- live AI backend queue

Those belong after the current mask interaction is correct.

/*
 * "Why doesn't this work?" - conditions a CSS property needs before it does anything.
 *
 * The preview checks each condition against the elements a rule matches (see `lint` in
 * js/preview.js). A warning appears only when the condition fails for EVERY matched element.
 *   needs: 'not-inline'           the element is not display: inline (images, inputs etc. are fine)
 *          'flex'                 the element is a flex container
 *          'flex-or-grid'         the element is a flex or grid container
 *          'grid'                 the element is a grid container
 *          'parent-flex'          the parent is a flex container
 *          'parent-flex-or-grid'  the parent is a flex or grid container
 *          'parent-grid'          the parent is a grid container
 *          'positioned'           position is not static
 *          'positioned-or-item'   position is not static, or the parent is flex/grid (for z-index)
 *          'overflow-nowrap'      overflow is not visible and white-space keeps one line
 *          'inline-or-cell'       display is inline, inline-block or table-cell
 *          'not-flex-item'        the parent is not a flex or grid container
 * {prop}, {tag}, {display}, {position} and {parentDisplay} are filled in.
 */
(function (U) {
  U.data.cssConditions = [
    {
      props: ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'aspect-ratio'],
      needs: 'not-inline',
      msg: '`{prop}` has no effect on `<{tag}>`, because it is an inline element (`display: inline`). Add `display: inline-block` (or `block`) to this rule.'
    },
    {
      props: ['margin-top', 'margin-bottom', 'margin-block'],
      needs: 'not-inline',
      msg: 'Vertical margins are ignored on inline elements like `<{tag}>`. Add `display: inline-block` (or `block`).'
    },
    {
      props: ['justify-content', 'align-items', 'align-content', 'place-content', 'place-items', 'gap', 'row-gap', 'column-gap'],
      needs: 'flex-or-grid',
      msg: '`{prop}` only works on a flex or grid container, and this element has `display: {display}`. Add `display: flex` (or `grid`) to this rule.'
    },
    {
      props: ['flex-direction', 'flex-wrap', 'flex-flow'],
      needs: 'flex',
      msg: '`{prop}` only works on a flex container, and this element has `display: {display}`. Add `display: flex` to this rule.'
    },
    {
      props: ['grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-auto-flow', 'grid-auto-rows', 'grid-auto-columns', 'justify-items'],
      needs: 'grid',
      msg: '`{prop}` only works on a grid container, and this element has `display: {display}`. Add `display: grid` to this rule.'
    },
    {
      props: ['flex', 'flex-grow', 'flex-shrink', 'flex-basis'],
      needs: 'parent-flex',
      msg: '`{prop}` only works on children of a flex container, but the parent of `<{tag}>` has `display: {parentDisplay}`. Add `display: flex` to the parent\'s rule.'
    },
    {
      props: ['align-self', 'order'],
      needs: 'parent-flex-or-grid',
      msg: '`{prop}` only works on children of a flex or grid container, but the parent of `<{tag}>` has `display: {parentDisplay}`.'
    },
    {
      props: ['grid-column', 'grid-row', 'grid-area', 'justify-self'],
      needs: 'parent-grid',
      msg: '`{prop}` only works on children of a grid container, but the parent of `<{tag}>` has `display: {parentDisplay}`. Add `display: grid` to the parent\'s rule.'
    },
    {
      props: ['top', 'right', 'bottom', 'left', 'inset'],
      needs: 'positioned',
      msg: '`{prop}` does nothing while the element has `position: static` (the default). Add `position: relative` (to nudge it) or `absolute` (to place it).'
    },
    {
      props: ['z-index'],
      needs: 'positioned-or-item',
      msg: '`z-index` does nothing on a `position: static` element (unless it is a flex or grid item). Add `position: relative`.'
    },
    {
      props: ['text-overflow'],
      needs: 'overflow-nowrap',
      msg: '`text-overflow` only shows "…" when the text is kept on one line and cut off: also add `white-space: nowrap` and `overflow: hidden`.'
    },
    {
      props: ['vertical-align'],
      needs: 'inline-or-cell',
      msg: '`vertical-align` only moves inline things inside a line of text (and table cells). `<{tag}>` has `display: {display}`. To centre a box, use flexbox: `align-items: center` on the parent.'
    },
    {
      props: ['float'],
      needs: 'not-flex-item',
      msg: '`float` is ignored on children of a flex or grid container (the parent of `<{tag}>` has `display: {parentDisplay}`).'
    }
  ];
})(window.UILT);

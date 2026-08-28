// numbered from one: a zero z-index lifts nothing above later in-flow content, so the first member
// of a bare numeric enum silently does not layer
export enum ZIndexLayers {
  Dropdown = 1,
  Tooltip,
}

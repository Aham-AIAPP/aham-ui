// Type declarations for aham.js. Hand-written; tests/structure.test.mjs checks that the names match the exports.
// Every init* / create* handle has destroy(): it removes the listeners, shortcuts and elements the call added
// (docs/react.md shows mounting in useEffect and destroying in its clean-up).

export interface Handle { destroy(): void }
type Root = HTMLElement;
type Release = () => void;

// ── Core ──
export function pushLayer(close: (reason: 'escape') => void): Release;
export function leave(el: HTMLElement, done: () => void): () => void;
export function lastInput(): 'pointer' | 'key';
export function icon(name: string): string;
export function escapeHtml(value: unknown): string;

// ── Shell ──
export interface ThemeHandle extends Handle { set(theme: 'light' | 'dark'): void; get(): 'light' | 'dark'; fromUrl: 'light' | 'dark' | null }
export function initTheme(root?: Root): ThemeHandle | null;
export interface ShellHandle extends Handle { set(open: boolean, options?: { persist?: boolean; restoreFocus?: boolean }): void; isOpen(): boolean; theme: ThemeHandle | null }
export function initShell(root?: Root): ShellHandle | null;
export interface PanelsHandle extends Handle { show(id: string | null, options?: { focus?: boolean; layer?: boolean; returnTo?: HTMLElement | null }): void; current(): string | null }
export function initPanels(root?: Root): PanelsHandle | null;
export function initSearch(root: Root, options?: { value?: string; onInput?(value: string): void }): (Handle & { open(options?: { focus?: boolean }): void; close(): void }) | null;
export function initTooltips(root?: Root): (Handle & { hide(): void }) | null;

// ── Popovers and menus ──
export type CloseReason = 'done' | 'escape' | 'outside' | 'replace';
export interface PopoverHandle { panel: HTMLElement; trigger: HTMLElement; place(): void; close(reason?: CloseReason): void }
export function openPopover(trigger: HTMLElement, panel: HTMLElement, options?: { align?: 'auto' | 'start' | 'end'; onClose?(reason: CloseReason): void; point?: { x: number; y: number } | null; returnFocus?: HTMLElement | null }): PopoverHandle;
export function closePopover(reason?: CloseReason): void;
export function activePopover(): PopoverHandle | null;

export interface CommandItem {
  id: string; label: string; icon?: string; prefix?: string; count?: number; checked?: boolean; current?: boolean;
  arrow?: boolean; keys?: string; danger?: boolean; keywords?: string[]; group?: number | string; heading?: string;
}
export interface CommandHandle extends Handle { render(): void; input: HTMLInputElement | null; focus(): void; setItems(items: CommandItem[] | ((query: string) => CommandItem[])): void }
export function createCommand(host: HTMLElement, options: {
  items: CommandItem[] | ((query: string) => CommandItem[]); onSelect(item: CommandItem): void; onBack?(): void;
  placeholder?: string; empty?: string; search?: boolean; label?: string; role?: 'listbox' | 'menu';
}): CommandHandle;
export function openPicker(anchor: HTMLElement, options: { label: string; options: string[]; current?: string; icon?: string; onSelect(value: string): void; returnFocus?: HTMLElement }): PopoverHandle;
export function initContextMenu(options: { root: Root; target: HTMLElement; rowSelector?: string; items(row: HTMLElement): CommandItem[] }): Handle & { open(row: HTMLElement, point?: { x: number; y: number }): void };

// ── Command palette ──
export interface PaletteItem extends CommandItem { run?(context: PaletteContext | null): void; children?(context: PaletteContext | null): PaletteItem[] }
export interface PaletteGroup { heading: string; items: PaletteItem[] }
export interface PaletteContext { id: unknown; code?: string; label: string }
export interface PaletteHandle extends Handle { open(start?: { label: string; items: PaletteItem[] }): void; close(): void; openAt(label: string, items: PaletteItem[]): void; showShortcuts(): void }
export function initPalette(options: { root: Root; groups(context: PaletteContext | null): PaletteGroup[]; context?(): PaletteContext | null; shell?: boolean; accountItems?(): PaletteItem[] }): PaletteHandle;
export function navCommands(root: Root): PaletteItem[];
export function shortcutItems(): PaletteItem[];
export function shellGroups(root: Root, options?: { accountItems?(): PaletteItem[]; showShortcuts?(): void }): PaletteGroup[];

// ── Shortcuts ──
export interface Shortcut { keys: string; label?: string; group?: string; when?(e?: KeyboardEvent): boolean; run?(e: KeyboardEvent): void; external?: boolean }
export function registerShortcut(def: Shortcut): Release;
export function listShortcuts(): { keys: string; label: string; group: string }[];
export function formatKeys(keys: string): string[];
export function keyStep(e: KeyboardEvent): string;
export function setSingleKeyShortcuts(on: boolean): void;
export function singleKeyShortcuts(): boolean;

// ── Dialogs ──
export interface DialogHandle { dialog: HTMLDialogElement; close(after?: () => void): void; readonly closed: boolean }
export function openDialog(options: { root: Root; className?: string; labelledBy?: string; html: string; returnFocus?: HTMLElement; onEscape?(): void; onBackdrop?(): void }): DialogHandle;
export function openConfirm(options: {
  root: Root; title: string; text?: string; confirm?: string; danger?: boolean; reason?: { label: string } | null;
  choices?: { label: string; value: string; danger?: boolean }[]; onConfirm?(reason?: string): void; onChoice?(value: string): void;
  returnFocus?: HTMLElement; cancel?: string;
}): { close(): void };
export interface FormField { key: string; label: string; type?: 'text' | 'number' | 'select'; options?: string[]; value?: string; required?: boolean; hint?: string; inputmode?: string }
export function openFormDialog(options: { root: Root; title: string; text?: string; fields?: FormField[]; submit?: string; onSubmit(values: Record<string, string>): boolean | string | Record<string, string> | Promise<boolean | string | Record<string, string>>; returnFocus?: HTMLElement }): { close(): void; dialog: HTMLDialogElement };
export function openCreateDialog(options: { root: Root; title: string; scope?: string; fields?: { key: string; label: string; options: string[]; icon?: string; value?: string }[]; onSubmit(values: Record<string, string>): boolean | Promise<boolean>; returnFocus?: HTMLElement;
  nameLabel?: string; inputs?: { key: string; label: string; placeholder?: string; maxlength?: number }[]; description?: string | false; check?(values: Record<string, string>): string | null | undefined }): { close(): void };
export function showBatchResult(options: { root: Root; action: string; noun: string; total: number; failed?: { name: string; reason: string }[]; returnFocus?: HTMLElement }): { close(): void } | null;
export function openSplitDialog(options: { root: Root; title: string; sections: { id: string; label: string; icon?: string }[]; render(id: string): string; start?: string; onShow?(id: string, body: HTMLElement): void; returnFocus?: HTMLElement }): DialogHandle & { body: HTMLElement; show(id: string): void; current(): string };
export function initAccountMenu(options: { root: Root; button?: HTMLElement; account?: string; items(): CommandItem[]; onSelect(item: CommandItem): void }): (Handle & { open(): void; menu: HTMLElement }) | null;
export function toast(message: string, options?: { action?: { label: string; run(): void }; duration?: number }): () => void;

// ── Lists ──
export interface Filter { field: string; op: string; values: unknown[] }
export interface FilterField { key: string; label: string; type: string; icon?: string; options?: string[]; unit?: string; parse?(input: string): unknown; format?(value: unknown): string }
export const FILTER_OPERATORS: Record<string, [string, string][]>;
export function operatorLabel(type: string, op: string): string;
export function fitOperator(type: string, op: string, values: unknown[]): string;
export function filterComplete(filter: Filter, type: string): boolean;
export function matchesFilter(value: unknown, filter: { op: string; values: unknown[] }): boolean;
export function filtersToParam(filters: Filter[]): string;
export function paramToFilters(raw: string | null, fields: FilterField[]): Filter[];
export function initFilter(options: { root: Root; trigger: HTMLElement; bar: HTMLElement; fields: FilterField[]; value?: Filter[]; counts?(key: string, option: string, others: Filter[]): number; onChange(filters: Filter[]): void }): Handle & { get(): Filter[]; set(filters: Filter[]): void; open(): void };
export interface DisplayState { group: string | null; sort: { field: string; dir: 'asc' | 'desc' }; density: 'standard' | 'compact'; columns: [string, boolean][] }
export function initDisplay(options: { root: Root; trigger: HTMLElement; groups: [string, string][]; sorts: [string, string][]; columns: [string, string][]; value: DisplayState; defaults: DisplayState; onChange(state: DisplayState): void }): Handle & { get(): DisplayState; set(state: DisplayState): void };
export function initListKeys(options: { table: HTMLTableElement; onPreview?(id: string): void; onOpen?(id: string): void; onToggle?(id: string): void; onMove?(row: HTMLTableRowElement): void; onRange?(ids: string[], checked: boolean): void }): Handle & { refresh(): void; current(): HTMLTableRowElement | null; focus(id: unknown): void };
export function initPropertyPickers(options: { container: HTMLElement; fields: Record<string, { label: string; options: string[]; icon?: string }>; value: Record<string, string>; onChange(key: string, value: string, old: string): void }): Handle & { set(value: Record<string, string>): void; get(): Record<string, string> };
export function initSingleExpand(list: HTMLElement): Handle & { open(index: number): void };
export function initTreeTable(table: HTMLTableElement, options?: { onToggle?(id: string, open: boolean): void; onMove?(row: HTMLTableRowElement): void }): Handle & { refresh(): void; expandAll(): void; collapseAll(): void; current(): HTMLTableRowElement | null; focus(id: unknown): void };
export function toCSV(rows: Record<string, unknown>[], columns: { key: string; label: string; value?(row: Record<string, unknown>): unknown }[]): string;
export function downloadText(name: string, text: string, type?: string): void;
export function treeTotals<T extends { id: unknown; parent?: unknown }>(rows: T[], value: (row: T) => number): Map<unknown, number>;
export function diffRecords<T extends Record<string, unknown>>(before: T[], after: T[], options?: { key?: string; fields?: (string | { key: string })[] }): { added: T[]; removed: T[]; changed: { id: string; before: T; after: T; fields: { field: string; from: unknown; to: unknown }[] }[]; unchanged: number };

// ── Records and documents ──
export function initComposer(form: HTMLFormElement, options: { onSubmit(text: string): boolean | Promise<boolean> }): Handle & { submit(): void };
export function initAnchorBar(nav: HTMLElement, options: { scroller: HTMLElement }): Handle & { refresh(): void };
export interface ObjectProblem { control: HTMLElement; message: string; severity: 'error' | 'warning' }
export function initObjectPage(root: Root, options?: {
  edit?: HTMLElement; footer?: HTMLElement; messages?: HTMLElement; validate?(root: Root): ObjectProblem[];
  onSave?(values: Record<string, string>): Promise<void>; saved?: string; canEdit?(): boolean; changed?(): boolean;
  draft?: { interval?: number; onDraft(values: Record<string, string>): Promise<void>; onDiscard?(info: { changed: boolean }): void } | null;
}): Handle & { enter(target?: HTMLElement): void; check(): ObjectProblem[]; save(): Promise<void>; cancel(): void; discard(): void; saveDraft(): Promise<void>; values(): Record<string, string>; isDirty(): boolean };
export function personHTML(name: string, options?: { size?: 'xs' | 'sm' | 'md'; label?: string; compact?: boolean }): string;
export function avatarCat(name: string): number;
export const STAGE_STATE_WORDS: Record<'todo' | 'current' | 'done' | 'blocked' | 'off', string>;
export function stageIconHTML(options?: { state?: 'todo' | 'current' | 'done' | 'blocked' | 'off'; done?: number; total?: number; label?: string }): string;

// ── Files ──
export const FILE_CATS: Record<number, string[]>;
export function fileCat(name: string): number;
export function checkFile(file: { name: string; size: number }, options?: { accept?: string[]; maxSize?: number }): string | null;
export function formatBytes(n: number): string;
export interface DroppedFile { file: File; name: string; path: string; size: number; error: string | null }
export function initDropZone(zone: HTMLElement, options: { accept?: string[]; maxSize?: number; onFiles(files: DroppedFile[]): void }): Handle & { open(folder?: boolean): void };
export function initViewer(root: Root, options?: { pages?: number; page?: number; width?: number; height?: number; onPage?(page: number): void; onZoom?(zoom: number): void }): Handle & {
  load(options: { pages?: number; page?: number; width?: number; height?: number }): void; setPage(page: number): void; setZoom(zoom: number, fit?: boolean): void;
  fit(): void; show(): void; hide(): void; page(): number; zoom(): number;
};

// ── AI ──
export function aiEnabled(): boolean;
export function setAIEnabled(on: boolean): void;
export function createAIOutput(host: HTMLElement, options: {
  title: string; sources?: { label: string; href?: string }[]; consent?: string; needsConsent?(): boolean;
  generate(options: { signal: AbortSignal }): AsyncIterable<string>; adoptLabel?: string;
  onAdopt?(text: string): void; onEdit?(text: string): void; onDiscard?(): void;
}): Handle & { run(): Promise<void>; stop(): void; remove(): void; text(): string; element: HTMLElement };
export function showSuggestion(anchor: HTMLElement, options: { key: string; label: string; value: string; reason: string; onAccept(): void; onDismiss?(): void }): { remove(): void } | null;
export function openAIConfirm(options: { root: Root; title?: string; reason?: string; changes: { target: string; from?: string; to: string }[]; onConfirm?(changes: { target: string; from?: string; to: string }[]): void; returnFocus?: HTMLElement }): { close(): void };

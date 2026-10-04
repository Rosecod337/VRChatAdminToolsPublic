"use strict";

(function installWindowControls(root) {
  const bridge = root.clientApi;
  if (!bridge?.getWindowState || !bridge?.windowCommand) return;
  const document = root.document;
  const controls = document.createElement("div");
  controls.className = "nativeWindowControls";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Управление окном");
  const commands = [
    ["minimize", "Свернуть", "M4 12h16"],
    ["maximize", "Развернуть", "M5 5h14v14H5z"],
    ["close", "Закрыть окно", "m5 5 14 14M19 5 5 19"]
  ];
  for (const [command, label, path] of commands) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.windowCommand = command;
    button.setAttribute("aria-label", label);
    button.title = label;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const icon = document.createElementNS(svg.namespaceURI, "path");
    icon.setAttribute("d", path);
    svg.append(icon); button.append(svg); controls.append(button);
    button.addEventListener("click", () => { void bridge.windowCommand(command).then(refresh).catch(() => {}); });
  }
  document.body.append(controls);
  function refresh(state) {
    if (!state?.frameless) { controls.hidden = true; return; }
    document.body.classList.add("nativeWindow");
    document.body.classList.toggle("nativeWindowMaximized", state.maximized);
    const maximize = controls.querySelector('[data-window-command="maximize"]');
    const label = state.maximized ? "Восстановить окно" : "Развернуть";
    const translated = root.betaI18n?.translate(label) || label;
    maximize.title = translated;
    maximize.setAttribute("aria-label", translated);
    maximize.querySelector("path").setAttribute("d", state.maximized ? "M4 8h12v12H4zM8 4h12v12" : "M5 5h14v14H5z");
  }
  root.clientApi.onWindowState?.(refresh);
  void bridge.getWindowState().then(refresh).catch(() => { controls.remove(); });
})(window);

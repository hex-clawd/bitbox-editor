/**
 * Tiny HTML partial loader.
 * Replaces any element with [data-include="path.html"] with the fetched HTML.
 *
 * IMPORTANT: If you open index.html directly*

cat > index.html <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bitbox Preset Editor – UI Prototype</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>

<div class="app">
  <header class="toolbar" data-tpl="tpl-toolbar"></header>

  <main class="content">
    <section class="pad-main" data-tpl="tpl-waveform"></section>
    <section class="pad-details" data-tpl="tpl-pad-details"></section>
  </main>
</div>

<!-- ================= TEMPLATES ================= -->

<template id="tpl-toolbar">
  <div class="placeholder">Toolbar</div>
</template>

<template id="tpl-waveform">
  <div class="wf">
    <div class="wf-row wf-overview inset">Waveform overview</div>
    <div class="wf-row wf-detail inset">Waveform detail</div>
  </div>
</template>

<template id="tpl-pad-details">
  <div class="pads inset">Pads</div>
  <div class="panel inset">Main</div>
  <div class="panel inset">Mod</div>
</template>

<!-- ============================================= -->

<script src="./ui.js"></script>
</body>
</html>

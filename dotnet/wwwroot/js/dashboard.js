// Live SignalR wiring for the HomePulse dashboard. Connects to /hubs/network
// (cookie auth is sent automatically, same-origin) and reflects real server
// events in the UI: connection status badge, toast alerts, and in-place
// updates to device/service cards already rendered on the current page.
(function () {
    const badge = document.getElementById('signalr-status-badge');

    function setBadge(state) {
        if (!badge) return;
        const dot = badge.querySelector('span:first-child');
        const label = badge.querySelector('span:last-child');
        const styles = {
            connecting: ['bg-amber-500 animate-pulse', 'text-amber-400', 'Connecting...'],
            connected: ['bg-emerald-500 animate-pulse', 'text-emerald-400', 'Connected'],
            disconnected: ['bg-rose-500', 'text-rose-400', 'Disconnected']
        };
        const [dotClass, textClass, text] = styles[state];
        dot.className = 'w-2 h-2 rounded-full ' + dotClass;
        label.className = textClass;
        label.textContent = text;
    }

    function toast(title, message, severity) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const colors = {
            Info: 'border-indigo-700/60 bg-indigo-950/90',
            Warning: 'border-amber-700/60 bg-amber-950/90',
            Critical: 'border-rose-700/60 bg-rose-950/90'
        };
        const el = document.createElement('div');
        el.className = 'pointer-events-auto p-3.5 rounded-xl border shadow-xl text-xs text-slate-100 ' + (colors[severity] || colors.Info);
        el.innerHTML = '<div class="font-bold mb-0.5">' + escapeHtml(title) + '</div><div class="text-slate-300">' + escapeHtml(message) + '</div>';
        container.appendChild(el);
        setTimeout(() => {
            el.style.transition = 'opacity 0.4s';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 400);
        }, 6000);
    }

    function escapeHtml(text) {
        return (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function patchDeviceCard(mac, isOnline, latencyMs, ipAddress) {
        const card = document.querySelector('[data-device-mac="' + mac + '"]');
        if (!card) return;
        const dot = card.querySelector('[data-field="status-dot"]');
        const latency = card.querySelector('[data-field="latency"]');
        const ip = card.querySelector('[data-field="ip"]');
        if (dot) dot.className = 'w-2 h-2 rounded-full mb-1 ' + (isOnline ? 'bg-emerald-500' : 'bg-rose-500');
        if (latency) latency.textContent = isOnline ? (Math.round(latencyMs * 10) / 10) + 'ms' : 'Down';
        if (ip && ipAddress) ip.textContent = ipAddress;
    }

    function patchServiceCard(service) {
        const card = document.querySelector('[data-service-id="' + service.id + '"]');
        if (!card) return;
        const statusCode = card.querySelector('[data-field="status-code"]');
        const latency = card.querySelector('[data-field="latency"]');
        if (statusCode) {
            statusCode.textContent = service.lastStatusCode;
            statusCode.className = 'text-[10px] font-mono px-1.5 py-0.2 rounded ' +
                (service.isOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800');
        }
        if (latency) latency.textContent = service.responseLatencyMs + ' ms';
    }

    if (typeof signalR === 'undefined') {
        setBadge('disconnected');
        return;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/network')
        .withAutomaticReconnect()
        .build();

    connection.onreconnecting(() => setBadge('connecting'));
    connection.onreconnected(() => setBadge('connected'));
    connection.onclose(() => setBadge('disconnected'));

    connection.on('ReceiveAlert', (alert) => {
        toast(alert.title, alert.message, alert.severity);
    });

    connection.on('ReceiveDeviceDiscovered', (device) => {
        toast('New Device Detected', device.customAlias + ' (' + device.ipAddress + ')', 'Warning');
    });

    connection.on('ReceiveDeviceStatusChanged', (ipAddress, macAddress, isOnline, latencyMs) => {
        patchDeviceCard(macAddress, isOnline, latencyMs, ipAddress);
    });

    connection.on('ReceiveDeviceUpdated', (device) => {
        patchDeviceCard(device.macAddress, device.isOnline, device.pingLatencyMs, device.ipAddress);
    });

    connection.on('ReceiveServiceHealth', (service) => {
        patchServiceCard(service);
    });

    connection.on('ReceiveSpeedTestResult', (record) => {
        toast('Speed Test Complete', record.downloadMbps + ' Mbps down / ' + record.uploadMbps + ' Mbps up', 'Info');
    });

    connection.on('ReceiveScanProgress', (scanned, total, message) => {
        const wrap = document.getElementById('scan-progress-wrap');
        const bar = document.getElementById('scan-progress-bar');
        const text = document.getElementById('scan-progress-text');
        if (!wrap || !bar || !text) return;
        if (scanned >= total) {
            wrap.classList.add('hidden');
            return;
        }
        wrap.classList.remove('hidden');
        bar.style.width = Math.round((scanned / total) * 100) + '%';
        text.textContent = message;
    });

    setBadge('connecting');
    connection.start()
        .then(() => setBadge('connected'))
        .catch(() => setBadge('disconnected'));
})();

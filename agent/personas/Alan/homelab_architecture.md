# Home Lab Environment

## Workstations
- **Main PC:** Linux Mint Debian Edition 7 (LMDE 7)
- **Laptop:** Linux Mint Debian Edition 7 (LMDE 7)
- **Sugey's Laptop:** Windows 11 (Lenovo)

## Network Hardware
- **ASUS ROG Rapture GT-AC5300:** Factory-reset on 2026-07-05. Role: Wi-Fi for **Sugey's office** — currently deployed as a **separate subnet** (router mode); may be reconfigured to **AP mode** later.
  - Reset note: hold Reset ~5–10 s (release when Power LED flashes ~4 s in); do **not** over-hold (~20 s puts it in an odd state). After reset, red Internet LED + no WAN-port LED is **normal** until WAN is configured. Verify via wired DHCP lease + HTTP, not ICMP (router may drop ping).
  - Recovery fallback: Rescue Mode (unplug, hold Reset, reapply power until Power LED flashes) + ASUS Firmware Restoration utility (Windows, wired).

## Network Services
- **DNS/DHCP:** dnsmasq (192.168.1.10, config: `/etc/dnsmasq.d/dnsmasq.conf`)
- **Domain:** lan
- **SSH alias:** `ssh lap` → 192.168.1.11

## Active Services
- **Home Automation:** Home Assistant (192.168.1.3, VM via VirtualBox)
  - **Auto-start:** systemd user service at `~/.config/systemd/user/homeassistant-vm.service`
  - Graceful shutdown via ACPI power button on boot/shutdown
  - Run `systemctl --user enable homeassistant-vm.service` to activate (enabled)
- **Development Workloads:** NavIntel environment prototyping; neural network library development (feed-forward and backpropagation testing).

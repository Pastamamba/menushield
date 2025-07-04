import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../auth/AuthContext";

interface QRCodeOptions {
  size: number;
  level: "L" | "M" | "Q" | "H";
  includeMargin: boolean;
  bgColor: string;
  fgColor: string;
}

export default function QRCodeManager() {
  const { token } = useAuth();
  const [restaurantId] = useState("abc123"); // This would come from auth context in real app
  const [qrOptions, setQrOptions] = useState<QRCodeOptions>({
    size: 200,
    level: "M",
    includeMargin: true,
    bgColor: "#FFFFFF",
    fgColor: "#000000",
  });

  const qrRef = useRef<HTMLDivElement>(null);
  const [customText, setCustomText] = useState("");

  const baseUrl = window.location.origin;
  const menuUrl = `${baseUrl}/menu?rid=${restaurantId}`;

  const downloadQRCode = (format: "svg" | "png", size: number = 512) => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    if (format === "svg") {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `menu-qr-code.svg`;
      downloadLink.click();
      URL.revokeObjectURL(svgUrl);
    } else {
      // Convert SVG to PNG
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      canvas.width = size;
      canvas.height = size;

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = qrOptions.bgColor;
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);

          canvas.toBlob((blob) => {
            if (blob) {
              const pngUrl = URL.createObjectURL(blob);
              const downloadLink = document.createElement("a");
              downloadLink.href = pngUrl;
              downloadLink.download = `menu-qr-code-${size}px.png`;
              downloadLink.click();
              URL.revokeObjectURL(pngUrl);
            }
          });
        }
        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const generateTableTent = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Table Tent - Menu QR Code</title>
                <style>
                    @page { size: A4; margin: 0.5in; }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px;
                        text-align: center;
                    }
                    .table-tent {
                        width: 100%;
                        max-width: 400px;
                        margin: 0 auto;
                        border: 2px dashed #ccc;
                        padding: 30px;
                        background: white;
                    }
                    .qr-code {
                        margin: 20px 0;
                    }
                    .title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #16a34a;
                        margin-bottom: 10px;
                    }
                    .subtitle {
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .instructions {
                        font-size: 14px;
                        color: #333;
                        line-height: 1.4;
                    }
                    .url {
                        font-size: 12px;
                        color: #666;
                        margin-top: 15px;
                        word-break: break-all;
                    }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="table-tent">
                    <div class="title">MenuShield</div>
                    <div class="subtitle">Allergy-Safe Menu</div>
                    <div class="qr-code">${svgData}</div>
                    <div class="instructions">
                        <strong>Scan this QR code to:</strong><br>
                        • View our allergy-safe menu<br>
                        • Filter dishes by your allergens<br>
                        • Find safe dining options<br>
                        ${customText ? `<br><em>${customText}</em>` : ""}
                    </div>
                    <div class="url">${menuUrl}</div>
                </div>
                <div class="no-print" style="margin-top: 30px;">
                    <button onclick="window.print()" style="
                        background: #16a34a; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        margin-right: 10px;
                    ">Print Table Tent</button>
                    <button onclick="window.close()" style="
                        background: #6b7280; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">Close</button>
                </div>
            </body>
            </html>
        `);

    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">QR Code & Sharing</h2>
        <p className="text-gray-600">
          Generate and customize QR codes for your allergy-safe menu
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* QR Code Preview */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">QR Code Preview</h3>

          <div className="text-center mb-6">
            <div
              ref={qrRef}
              className="inline-block p-4 bg-white rounded-lg shadow-sm"
              style={{ backgroundColor: qrOptions.bgColor }}
            >
              <QRCodeSVG
                value={menuUrl}
                size={qrOptions.size}
                level={qrOptions.level}
                includeMargin={qrOptions.includeMargin}
                bgColor={qrOptions.bgColor}
                fgColor={qrOptions.fgColor}
              />
            </div>
          </div>

          {/* Download Options */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadQRCode("png", 512)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download PNG (512px)
              </button>
              <button
                onClick={() => downloadQRCode("png", 1024)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download PNG (1024px)
              </button>
            </div>

            <button
              onClick={() => downloadQRCode("svg")}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Download SVG (Vector)
            </button>

            <button
              onClick={generateTableTent}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Generate Table Tent (Print Ready)
            </button>
          </div>
        </div>

        {/* Customization Options */}
        <div className="space-y-6">
          {/* QR Code Settings */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Customize QR Code</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Size: {qrOptions.size}px
                </label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="32"
                  value={qrOptions.size}
                  onChange={(e) =>
                    setQrOptions((prev) => ({
                      ...prev,
                      size: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Error Correction Level
                </label>
                <select
                  value={qrOptions.level}
                  onChange={(e) =>
                    setQrOptions((prev) => ({
                      ...prev,
                      level: e.target.value as any,
                    }))
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={qrOptions.bgColor}
                    onChange={(e) =>
                      setQrOptions((prev) => ({
                        ...prev,
                        bgColor: e.target.value,
                      }))
                    }
                    className="w-full h-10 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Foreground Color
                  </label>
                  <input
                    type="color"
                    value={qrOptions.fgColor}
                    onChange={(e) =>
                      setQrOptions((prev) => ({
                        ...prev,
                        fgColor: e.target.value,
                      }))
                    }
                    className="w-full h-10 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={qrOptions.includeMargin}
                    onChange={(e) =>
                      setQrOptions((prev) => ({
                        ...prev,
                        includeMargin: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm">Include margin</span>
                </label>
              </div>
            </div>
          </div>

          {/* Share Links */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Share Links</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Direct Menu Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={menuUrl}
                    className="flex-1 border rounded-l px-3 py-2 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(menuUrl)}
                    className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Short Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={`${baseUrl}/m/${restaurantId}`}
                    className="flex-1 border rounded-l px-3 py-2 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(`${baseUrl}/m/${restaurantId}`)
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Custom Message</h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional text for table tents (optional)
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g., 'Ask your server about our daily specials!'"
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Generator</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 20px;
        }
        #qrcode {
            margin-top: 20px;
            padding: 10px;
            display: inline-block;
            background: white;
        }
        input {
            padding: 8px;
            font-size: 16px;
            margin: 10px;
            width: 250px;
            text-align: center;
        }
        button {
            padding: 10px 15px;
            font-size: 16px;
            background-color: #28a745;
            color: white;
            border: none;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background-color: #218838;
        }
    </style>
</head>
<body>

    <h2>iPhone-Compatible QR Code Generator</h2>
    
    <label for="idNumber">Enter Note or ID Number:</label>
    <input type="text" id="idNumber" value="My quick note">
    <button onclick="generateQRCode()">Generate QR Code</button>
    <button onclick="downloadQRCode()">Download QR Code</button>

    <div id="qrcode"></div>

    <script>
        function generateQRCode() {
            let inputText = document.getElementById("idNumber").value.trim();
            let qrContainer = document.getElementById("qrcode");
            
            if (inputText === "") {
                alert("Please enter a note or ID number!");
                return;
            }

            qrContainer.innerHTML = ""; // Clear previous QR code
            
            let qrData;
            if (isIphone()) {
                // Open iPhone shortcut to add text to Notes
                qrData = `shortcuts://run-shortcut?name=Add%20to%20Notes&input=${encodeURIComponent(inputText)}`;
            } else {
                // For non-iPhone users, just show text
                qrData = inputText;
            }

            new QRCode(qrContainer, {
                text: qrData,
                width: 150,
                height: 150
            });
        }

        function downloadQRCode() {
            let qrCanvas = document.querySelector("#qrcode canvas");
            if (!qrCanvas) {
                alert("Please generate a QR code first!");
                return;
            }

            let qrImage = qrCanvas.toDataURL("image/png");
            let downloadLink = document.createElement("a");
            downloadLink.href = qrImage;
            downloadLink.download = "qrcode.png";
            downloadLink.click();
        }

        function isIphone() {
            return /iPhone|iPad|iPod/i.test(navigator.userAgent);
        }

        // Auto-focus on input field & generate default QR code
        window.onload = function () {
            document.getElementById("idNumber").focus();
            generateQRCode();
        };
    </script>

</body>
</html>

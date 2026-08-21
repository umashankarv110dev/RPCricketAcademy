import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type ReceiptData = {
  receiptNumber: string;

  academyName: string;
  academyShortName: string;

  playerName: string;
  playerCode: string;

  feeMonth: string;
  receiptDate: string;

  monthlyFee: number;
  amountPaid: number;
  pendingAmount: number;

  paymentMode: string;
  transactionReference?: string | null;
};

function formatCurrency(
  amount: number
) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createFeeReceiptHtml(
  data: ReceiptData
) {
  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<style>

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    background: #f2f4f7;
    font-family: Arial, Helvetica, sans-serif;
    color: #202124;
  }

  .page {
    width: 100%;
    padding: 35px;
  }

  .receipt {
    background: white;
    border: 1px solid #dddddd;
    border-radius: 14px;
    padding: 30px;
  }

  .academy {
    text-align: center;
    padding-bottom: 20px;
  }

  .logo {
    width: 70px;
    height: 70px;
    border-radius: 18px;
    background: #d71920;
    color: white;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    font-size: 19px;
    font-weight: 900;
  }

  .academy-name {
    margin-top: 12px;
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0.4px;
  }

  .academy-subtitle {
    margin-top: 5px;
    font-size: 11px;
    color: #777777;
  }

  .receipt-heading {
    margin-top: 18px;
    padding: 14px 0;

    border-top: 1px solid #dddddd;
    border-bottom: 1px solid #dddddd;

    text-align: center;
  }

  .receipt-title {
    color: #d71920;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 1.5px;
  }

  .receipt-number {
    margin-top: 5px;
    color: #777777;
    font-size: 10px;
  }

  .info-grid {
    display: table;
    width: 100%;
    margin-top: 20px;
  }

  .info-cell {
    display: table-cell;
    width: 50%;
  }

  .label {
    font-size: 10px;
    color: #777777;
  }

  .value {
    margin-top: 5px;
    font-size: 13px;
    font-weight: bold;
  }

  .section {
    margin-top: 25px;
  }

  .section-title {
    padding-bottom: 8px;

    color: #d71920;

    font-size: 11px;
    font-weight: 900;

    letter-spacing: 0.8px;

    border-bottom: 1px solid #eeeeee;
  }

  .row {
    display: table;
    width: 100%;

    padding: 11px 0;

    border-bottom: 1px solid #f0f0f0;
  }

  .row-label {
    display: table-cell;
    width: 55%;

    font-size: 12px;
    color: #666666;
  }

  .row-value {
    display: table-cell;
    width: 45%;

    text-align: right;

    font-size: 12px;
    font-weight: bold;
  }

  .paid {
    color: #159447;
    font-size: 15px;
  }

  .balance {
    margin-top: 22px;

    padding: 18px;

    background: #fff4f4;

    border-radius: 12px;

    display: table;
    width: 100%;
  }

  .balance-left {
    display: table-cell;
    vertical-align: middle;
  }

  .balance-label {
    font-size: 10px;
    color: #777777;
  }

  .balance-value {
    margin-top: 4px;

    font-size: 22px;
    font-weight: 900;

    color: #d71920;
  }

  .success {
    display: table-cell;

    width: 40px;
    height: 40px;

    text-align: center;
    vertical-align: middle;

    font-size: 25px;
    color: #159447;
  }

  .footer {
    margin-top: 30px;

    text-align: center;

    font-size: 10px;
    color: #777777;
  }

  .footer strong {
    display: block;

    margin-bottom: 5px;

    color: #159447;
  }

  .note {
    margin-top: 25px;

    padding-top: 15px;

    border-top: 1px dashed #cccccc;

    text-align: center;

    font-size: 10px;
    color: #888888;
  }

</style>

</head>

<body>

<div class="page">

  <div class="receipt">

    <div class="academy">

      <div class="logo">
        ${escapeHtml(
          data.academyShortName
        )}
      </div>

      <div class="academy-name">
        ${escapeHtml(
          data.academyName
        )}
      </div>

      <div class="academy-subtitle">
        Professional Cricket Training
      </div>

    </div>


    <div class="receipt-heading">

      <div class="receipt-title">
        FEE RECEIPT
      </div>

      <div class="receipt-number">
        Receipt No: ${escapeHtml(
          data.receiptNumber
        )}
      </div>

    </div>


    <div class="info-grid">

      <div class="info-cell">

        <div class="label">
          Receipt Date
        </div>

        <div class="value">
          ${escapeHtml(
            data.receiptDate
          )}
        </div>

      </div>


      <div class="info-cell">

        <div class="label">
          Fee Month
        </div>

        <div class="value">
          ${escapeHtml(
            data.feeMonth
          )}
        </div>

      </div>

    </div>


    <div class="section">

      <div class="section-title">
        PLAYER INFORMATION
      </div>


      <div class="row">

        <div class="row-label">
          Player Name
        </div>

        <div class="row-value">
          ${escapeHtml(
            data.playerName
          )}
        </div>

      </div>


      <div class="row">

        <div class="row-label">
          Player Code
        </div>

        <div class="row-value">
          ${escapeHtml(
            data.playerCode
          )}
        </div>

      </div>

    </div>


    <div class="section">

      <div class="section-title">
        PAYMENT INFORMATION
      </div>


      <div class="row">

        <div class="row-label">
          Monthly Fee
        </div>

        <div class="row-value">
          ${formatCurrency(
            data.monthlyFee
          )}
        </div>

      </div>


      <div class="row">

        <div class="row-label">
          Amount Paid
        </div>

        <div class="row-value paid">
          ${formatCurrency(
            data.amountPaid
          )}
        </div>

      </div>


      <div class="row">

        <div class="row-label">
          Payment Mode
        </div>

        <div class="row-value">
          ${escapeHtml(
            data.paymentMode
          )}
        </div>

      </div>


      ${
        data.transactionReference
          ? `
      <div class="row">

        <div class="row-label">
          Transaction Reference
        </div>

        <div class="row-value">
          ${escapeHtml(
            data.transactionReference
          )}
        </div>

      </div>
      `
          : ""
      }

    </div>


    <div class="balance">

      <div class="balance-left">

        <div class="balance-label">
          REMAINING BALANCE
        </div>

        <div class="balance-value">
          ${formatCurrency(
            data.pendingAmount
          )}
        </div>

      </div>

      <div class="success">
        ✓
      </div>

    </div>


    <div class="footer">

      <strong>
        ✓ Payment successfully recorded
      </strong>

      This receipt is generated electronically
      by ${escapeHtml(
        data.academyName
      )}.

    </div>


    <div class="note">
      Thank you for choosing RPCA.
    </div>

  </div>

</div>

</body>

</html>
`;
}

export async function generateFeeReceiptPdf(
  data: ReceiptData
) {
  const html =
    createFeeReceiptHtml(data);

  const result =
    await Print.printToFileAsync({
      html,
      width: 595,
      height: 842,
    });

  return result.uri;
}

export async function shareFeeReceiptPdf(
  uri: string
) {
  const available =
    await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      "Sharing is not available on this device."
    );
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle:
      "Share RPCA Fee Receipt",
    UTI: "com.adobe.pdf",
  });
}
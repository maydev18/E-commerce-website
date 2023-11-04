const fs = require("fs");
const PDFDocument = require("pdfkit");

function createInvoice(invoice , invoicePath , invoiceName , logo , res) {
    let doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Desposition', 'inline; filename="' + invoiceName + '"');
    doc.pipe(res);
    doc.pipe(fs.createWriteStream(invoicePath));
    generateHeader(doc , logo);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    doc.end();
  }

function generateHeader(doc , logo) {
	doc.image(logo, 50, 45, { width: 100 })
		.fillColor('#444444')
		.fontSize(20)
		.text('.com', 150, 48)
		.fontSize(10)
		.text('123/1/1 flat-B4 Labour chowk', 200, 50, { align: 'right' })
		.text('Sant Nagar, Burari, Delhi-84', 200, 65, { align: 'right' })
		.moveDown();
}

function generateCustomerInformation(doc, invoice) {
    const dt = invoice.date.getDate() + "/" + invoice.date.getMonth() + "/" + invoice.date.getFullYear();
	doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number: ", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice._id, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(dt, 150, customerInformationTop + 15)
    .font("Helvetica-Bold")
    .text(invoice.fullname, 300, customerInformationTop)
    .font("Helvetica")
    .text("Shipping Address- " + invoice.fulladdress, 300, customerInformationTop + 15)
    .text(
        "Phone- " +
      invoice.phone +
        " , " +
        "Email- " + invoice.email,
      300,
      customerInformationTop + 40
    )
    .moveDown();
  generateHr(doc, customerInformationTop + 70);
}
function generateHr(doc, y) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }
  function generateTableRow(
    doc,
    y,
    item,
    unitCost,
    quantity,
    lineTotal
  ) {
    doc
      .fontSize(10)
      .text(item, 50, y)
      .text(unitCost, 200, y, { width: 90, align: "center" })
      .text(quantity, 310, y, { width: 90, align: "center" })
      .text(lineTotal, 470, y, { align: "center" });
  }
function generateInvoiceTable(doc, invoice) {
    const invoiceTableTop = 340;
  
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      invoiceTableTop,
      "Item",
      "Unit Cost",
      "Quantity",
      "Line Total"
    );
    let totalcost = 0;
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");
    let j;
    invoice.products.forEach((product , i) => {
        const position = invoiceTableTop + (i + 1) * 30;
        j = i;
        totalcost += (+product.product.price * +product.quantity);
        generateTableRow(
            doc,
            position,
            product.product.title,
            product.product.price,
            product.quantity,
            product.quantity * product.product.price
        );
      generateHr(doc, position + 20);
    })
    const subtotalPosition = invoiceTableTop + (j + 2) * 30;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Total",
      totalcost
    );
    doc.font("Helvetica");
  }
  module.exports = createInvoice;
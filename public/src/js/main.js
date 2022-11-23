class XLSXTOJSON {
  constructor(file) {
    this.file = file
    this.parseXLSX()
  }

  parseXLSX () {
    const reader = new FileReader();
  
    const file = this.file.name
    reader.onload = function (e) {
      const workbook = XLSX.read(e.target.result,  { type: 'binary' });
      workbook.SheetNames.forEach(async function (name) {
        const row = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[name]);
        let res = await axios.post("/file-uploaded", {params: { fileN: file, vals: JSON.parse(JSON.stringify(row)) }})
             .then(response => response.data).catch(err => console.warn(err));

        if(res.length > 0) {
          res.map((item) => {
            let temp = Number(item["Total Price"]) - (Number(item["COGS"]).toFixed(2) + Number(item["Bond Fee"]).toFixed(2) + Number(item["Brokerage"]).toFixed(2) +
            Number(item["GST/HST"]).toFixed(2) + Number(item["PST"]).toFixed(2) + Number(item["Discounts"]).toFixed(2) + Number(item["Duty"]).toFixed(2) + Number(item["Entry Prep Fee"]).toFixed(2) +
            Number(item["Fuel Surcharge"]).toFixed(2) + Number(item["Freight"]).toFixed(2) + Number(item["Residential Adjustments"]).toFixed(2) + Number(item["Shipping Charge Corrections"]).toFixed(2) +
            Number(item["Transportation Charges"]).toFixed(2) + Number(item["UPS Returns"]).toFixed(2) + Number(item["Other"]).toFixed(2)) 

            if(item["COGS"]) item["Profit"] = temp
            else item["Profit"] = "NAN"
          })

          let binaryWS = XLSX.utils.json_to_sheet(res); 
          let wb = XLSX.utils.book_new() 
          XLSX.utils.book_append_sheet(wb, binaryWS, 'Binary values') 
          XLSX.writeFile(wb, 'Summary-Werrv.xlsx');
        }
      });
    };
    reader.readAsBinaryString(this.file);
  };
}

const excelIDentifier = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

FilePond.registerPlugin(FilePondPluginFileEncode, FilePondPluginGetFile, FilePondPluginFileValidateType);
const pond = FilePond.create(document.querySelector('input[type="file"]'), {
  acceptedFileTypes: [excelIDentifier],
  fileValidateTypeLabelExpectedTypes: 'Expects an excel document',
  fileValidateTypeDetectType: (source, type) =>
      new Promise(async (resolve, _) => {

          if(type === excelIDentifier)
            new XLSXTOJSON(source)

          resolve(type)
      }),
  
  labelIdle: "<div><i class='fa fa-upload' aria-hidden='true' style='font-size: 20px;'></i></div>",
  files: ""
}); 





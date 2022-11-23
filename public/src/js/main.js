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
            let UPS = ["Bond Fee", "Brokerage", "GST/HST", "PST", "Discounts", "Duty", "Entry Prep Fee", "Fuel Surcharge", "Freight", "Residential Adjustments","Shipping Charge Corrections", "Transportation Charges", "UPS Returns", "Other" ]
            let temp = (Number(item["Total Price"]) - (Number(item["COGS"]) ) ).toFixed(2)
            UPS.forEach((comp) => {
              if(Number(item[comp]))
                temp -= Number(item[comp])
            })

    
            if(temp) item["Profit"] = temp
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





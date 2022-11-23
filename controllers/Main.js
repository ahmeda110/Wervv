let filtered = [], filesU = [],
params1 = ["Name", "Customer: Orders Count", "Price: Total Refund", "Price: Total Line Items", "Tax: Total", "Price: Total", "COGS", "CWR Freight",
        "Bond Fee", "Brokerage", "GST/HST", "PST", "Discounts", "Duty", "Entry Prep Fee", "Fuel Surcharge", "Freight", "Residential Adjustments", "Shipping Charge Corrections",
        "Transportation Charges", "UPS Returns", "Other", "Profit", "Line: SKU", "UPC", "Line: Grams",
        "Weight Total", "Shipping: Zip", "Shipping: City", "Shipping: Province Code", "Shipping: Country Code", "Shipment Date", "Line: Fulfillment Service", "Fulfillment: Tracking Company",
        "Fulfillment: Location", "Fulfillment: Status", "Fulfillment: Shipment Status", "Fulfillment: Tracking Number", "Tracking Match"],
params2 = ["Order Number", "Customer: Orders Count", "Total Refund", "Total Line Price", "Total Tax", "Total Price", "COGS", "CWR Freight",
        "Bond Fee", "Brokerage", "GST/HST", "PST", "Discounts", "Duty", "Entry Prep Fee", "Fuel Surcharge", "Freight", "Residential Adjustments", "Shipping Charge Corrections",
        "Transportation Charges", "UPS Returns", "Other", "Profit", "Line: SKU", "UPC", "Line: Grams",
        "Weight Total", "Shipping: Zip", "Shipping: City", "Shipping: Province Code", "Shipping: Country Code", "Shipment Date", "Line: Fulfillment Service", "Fulfillment: Tracking Company",
        "Fulfillment: Location", "Fulfillment: Status", "Fulfillment: Shipment Status", "Fulfillment: Tracking Number", "Tracking Match"],
mapO = {
        "Bond Fee": ["Bond Fee"],
        "Brockerage": ["Brokerage Charges", "Total Brokerage Charges"],
        "GST/HST": ["Brokerage GST/HST", "CA Customs HST", "Customs GST", "Total GST/HST", "GST", "HST"],
        "PST": ["CA British Columbia PST", "PST Quebec", "QST"],
        "Discounts": ["Discounts"],
        "Duty": ["Duty Amount"],
        "Entry Prep Fee": ["Entry Prep Fee"],
        "Fuel Surcharge": ["Fuel Surcharge"],
        "Freight": ["Import Freight", "Peak/Demand Surcharge-Com", "UPS Internet Shipping", "UPS WorldShip", "Worldwide Service"],
        "Residential Adjustments": ["Residential Adjustments"],
        "Shipping Charge Corrections": ["Shipping Charge Corrections"],
        "Transportation Charges": ["Transportation Charges"],
        "UPS Returns": ["UPS Returns Shipment Detail", "UPS WorldShip"],
        }

const https = require('https')
function Main(){
    return {
        display(req, res) {
            res.render('Landing');
        },
        async parseExcel(req, res) {

            if(!filesU.includes(req.body.params.fileN))
                filesU.push(req.body.params.fileN)


            if(req.body.params.fileN.includes('Werrv')){

                const url = 'https://www.bankofcanada.ca/valet/observations/FXCADUSD/json';

                let VAPI = https.get(url, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () =>  {
                    data = JSON.parse(data).observations
 
                    req.body.params.vals.map((item) => {
                        let temp = {}
                        for(let i = 0; i < params1.length; i++) {
                            const p = params1[i]
                            if(p in item) {
                                if(p === "Price: Total" || p === "Tax: Total" || p === "Price: Total Line Items" && item["Currency"] === "CAD") {
                                    let rate
                                    data.forEach((i) => {
                                        if(item["Processed At"].split(" ")[0] === i.d) {
                                            rate = Number(i.FXCADUSD.v)
                                        }
                                    })
                                    temp[params2[i]] = (Number(item[p]) * rate).toFixed(2)   
                                } else {
                                    temp[params2[i]] = item[p].toString() 
                                }
                                    
                            } else {
                                temp[params2[i]] = "" 
                            }
                            
                        }
                        filtered.push(temp)

                        filtered = filtered.reduce((accumulator, current) => {
                            let itemIndex = accumulator.findIndex(item => item["Order Number"] === current["Order Number"]);
                            if(itemIndex != -1) {
                                params2.forEach((item => {
                                    if(!current[item]) current[item] = accumulator[itemIndex][item]
                                    if(item === "Line: SKU" || item === "Line: Grams" || item === "Line: Fulfillment Service" || item === "Fulfillment: Tracking Number"){
                                        if(accumulator[itemIndex][item] && current[item] && !accumulator[itemIndex][item].includes(current[item]))
                                            current[item] += `, ${accumulator[itemIndex][item]}`
                                    }
                                }
                                ))
        
                                accumulator[itemIndex] = {...accumulator[itemIndex], ...current};
                            } else {
                                accumulator = accumulator.concat(current);
                            }
                            return accumulator;
                        }, []);
                })
    
                })

                })
                .on('error', err => {
                    console.log(err.message);
                })
            } 
            else if (req.body.params.fileN.includes('CWR')) {
                req.body.params.vals.map((item) => {
                    const poN = item["PO Number"], total = item["Total"]
                    filtered.forEach((p) => {
                       
                        if(poN === p["Order Number"]) {
                            
                                if(!p["COGS"]){
                                    p["COGS"] = total.toString()
                                } else p["COGS"] = (Number(p["COGS"]) + Number(total)).toFixed(2).toString()
                            
                                p["CWR Freight"] = item["Freight"].toString()
                                p["Shipment Date"] = item["Shipment Date"].toString()
                                p["UPC"] = item["UPC"]
                                p["Tracking Match"] = item["Tracking Number"] === p["Fulfillment: Tracking Number"] ? 1 : 0
                        }
                    })
                })
            }
            else if (req.body.params.fileN.includes('UPS')) {

                req.body.params.vals.map((item, index) => {
                    let refN = item["Tracking Number"]

                    if(refN){
                        filtered.forEach((p) => {
                            if(p["Fulfillment: Tracking Number"].includes(refN)) {
                                let tempUF = req.body.params.vals[index]["Shipping System / Adjustment"], tempF
                                Object.keys(mapO).forEach((key) => {
                                    if(mapO[key].includes(tempUF)){
                                        tempF = key
                                    }
                                })

                                if(!p[tempF])
                                    p[tempF] = req.body.params.vals[index]["Net Amount Due"]
                                if(tempUF.includes("Total")){
                                    p[tempF] = req.body.params.vals[index]["Net Amount Due"]
                                }

    
                                while(++index <= req.body.params.vals.length && req.body.params.vals[index] && !req.body.params.vals[index]["Tracking Number"]) {
                                    let tempUF = req.body.params.vals[index]["Shipping System / Adjustment"], tempF
                                    Object.keys(mapO).forEach((key) => {
                                        if(mapO[key].includes(tempUF)) {
                                            tempF = key
                                        }
                                    })

                                    if(!p[tempF])
                                        p[tempF] = req.body.params.vals[index]["Net Amount Due"]
                                    }
                                    if(tempUF.includes("Total")){
                                        p[tempF] = req.body.params.vals[index]["Net Amount Due"]
                                    }

                                return true
                            }
                        })
                    }
                })
            }

            if(filesU.length == 3) {
                res.send(filtered)
            } 
            else res.send([])
        }
    }
}

module.exports = Main
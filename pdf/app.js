const PDFDocument = require('pdfkit');
const fs = require("fs");

//const SVGtoPDF = require('svg-to-pdfkit');
const chartExporter = require("highcharts-export-server");
const SenseAiTion = require('@sense.ai.tion/sense_ai_tion_api')

let pdfDoc = new PDFDocument;
// create the PDF Document
pdfDoc.pipe(fs.createWriteStream('SampleDocument.pdf'));


let defaultClient = SenseAiTion.ApiClient.instance;
// Configure API key authorization: APIKeyHeader
let APIKeyHeader = defaultClient.authentications['APIKeyHeader'];
APIKeyHeader.apiKey = 'apikey-5f2bdc17e707c5b301036b39';
// let OTPKeyHeader = defaultClient.authentications['OTPKeyHeader'];
// OTPKeyHeader.apiKey = 'YOUR API KEY';
// Configure OAuth2 access token for authorization: googleIdToken
// let googleIdToken = defaultClient.authentications['googleIdToken'];
// googleIdToken.accessToken = 'YOUR ACCESS TOKEN';

let orderApiInstance = new SenseAiTion.OrdersApi();
let profileApiInstance = new SenseAiTion.ProfileApi();

let id = "5fa8898229ba7c3786f742b4"; // String | primary key of the order, placed before
orderApiInstance.orderGetResult(id, (error, orderData, response) => {
  if (error) {
    console.error(error);
  } else {
    
    profileApiInstance.customerGet((error, customerData, response) => {
      if (error) {
        console.error(error);
      } else {
        var data = orderData;
        var text1, text2;
        for(var i=0; i < data.results.length; i++){
          if(data.results[i].source == "defaultRole"){
            text1 = data.results[i].text;
            text2 = data.results[i].words[1].word
          }
          if(data.results[i].attachments != null){
            for(var k = 0; k < data.results[i].attachments[0].annotations.length; k++){
              if(data.results[i].attachments[0].annotations[k].value == "motivation"){
                var vector = data.results[i].attachments[0].annotations[k].vector
              } else if (data.results[i].attachments[0].annotations[k].value == "focus"){
              var focusVector = data.results[i].attachments[0].annotations[k].vector
              }
              else if(data.results[i].attachments[0].annotations[k].value == "orientation"){
                var orientationVector = data.results[i].attachments[0].annotations[k].vector
              }
            }
          }
        }

        // gathering the focus and orientation vectors in one

        var vector2 = []

        for(i in orientationVector){
          if(orientationVector[i].name == "future" || orientationVector[i].name == "present" || orientationVector[i].name == "past")
          vector2.push(orientationVector[i])
        }
        
        for(i in focusVector){
          if(focusVector[i].name == "sense" || focusVector[i].name == "emotions" || focusVector[i].name == "facts"){
            vector2.push(focusVector[i])
          }
        }
        
        // Translating the values names

        for(i in vector2){
          switch(vector2[i].name){
            case 'future':
              vector2[i].name = "Zukunft"
              break;
            case 'present':
              vector2[i].name = "Gegenwart"
              break;
            case 'past':
              vector2[i].name = "Vergangenheit"
              break;
            case 'sense':
              vector2[i].name = "Sinn"
              break;
            case 'emotions':
              vector2[i].name = "Emotionen"
              break;
            case 'facts':
              vector2[i].name = "Fakten"
              break;
          }
        }


        // Get the clear text without HTML tags
        var header = text1.split("<b>")[1];
        header = header.split("</b>")[0];

        var txt2 = text2.split("<p>")[1];
        txt2 = txt2.split("</p>")[0];
        
        
        // Create explanations for every color
        for(i in vector){
          switch(vector[i].name){
            case 'white':
              vector[i].explanation = "Empathie"
              break;
            case 'green':
              vector[i].explanation = "Sicherheit"
              break;
            case 'blue':
              vector[i].explanation = "Anerkennung"
              break;
            case 'yellow':
              vector[i].explanation = "Zugehörigkeit"
              break;
            case 'red':
              vector[i].explanation = "Durchsetzung"
              break;
            case 'black':
              vector[i].explanation = "Rationalität"
              break;
          }
          
        }

        console.log(vector)
        console.log(vector2)

        
        //Initialize the exporter to create the chart
        chartExporter.initPool();

        // prepare the data proper format to display two bar charts in one image
        var catgrs = [];
        var data1 = [{y:1},{y:2},{y:3},{y:4},{y:5},{y:6}, {y:null} , {y:null}, {y:null}, {y:null}, {y:null}, {y:null}]
        var data2 = [{y:null} , {y:null}, {y:null}, {y:null}, {y:null}, {y:null},{y:1},{y:2},{y:3},{y:4},{y:5},{y:6} ]

        for(var i=0;i<12;i++){
          if(i<6){
            catgrs[i] = vector[i].explanation
            data1[i].y = Math.floor(vector[i].value); 
          }
          else if(i>=6){
            catgrs[i] = vector2[i-6].name
            data2[i].y = Math.floor(vector2[i-6].value);
          }
        }


        // Chart Options here, API Reference: https://api.highcharts.com/

        const chartDetails = {

          type: "png",
          options: {
            chart: {
              type: 'column',
              height : 400,
              inverted: true
            },
          
            plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                        }
                    }
                },
            yAxis: {
                allowDecimals: false,
                min: 40,
                title: {
                    text: '   ',
                    margin:40
                }
            },
            xAxis: {
                categories: catgrs
            },
            legend: {
              floating: true,
              itemDistance: 20,
              verticalAlign: 'middle',
              align:'right',
              layout: 'vertical',
              itemStyle: {
                  color: '#000000',
                  fontSize: '12px',
                  borderWidth: 4,
                  margin : 5,
                  textOverflow: 'clip'
              }
            },
            credits: {
              enabled : false
            },
            series: [{
                name: 'Motivation',
                color: 'rgba(223, 83, 83, .5)',
                data : data1
            },{
                name: 'Orientation',
                color: 'rgba(119, 152, 191, .5)',
                data : data2
            }],
                title: {
                text: header
            }
          }
        }







      chartExporter.export(chartDetails, (err, res) => {
        // Get the image data (base64)
        let imageb64 = res.data;

        // Image of the customer logo
        let customerImage64 = customerData.image;
        // Filename of the barcharts
        let outputFile = "bar.png";

        // Filename of the customer logo
        let outputFile2 = "customer.png"

        // Save the image to file
        fs.writeFileSync(outputFile, imageb64, "base64", function(err) {
            if (err) console.log(err);
        });

        fs.writeFileSync(outputFile2, customerImage64, "base64", function(err) {
          if (err) console.log(err);
        });

        console.log("Saved image!");
        chartExporter.killPool();


        //inflate the pdf
        pdfDoc.fontSize(18).font('Helvetica-Bold')
          .text(data.userName, {align : 'center'} );

          
        pdfDoc.image('bar.png', 25, 110, {align:"left" , width:550})
        console.log("Image inserted!");   

        pdfDoc.moveDown(18);

        pdfDoc.fontSize(18).font('Helvetica-Bold')
          .text(header, {align : 'left'} );

        pdfDoc.fontSize(18).font('Helvetica')
        .text(txt2, {align : 'justify'} );
        
        pdfDoc.moveDown(3)
        pdfDoc.image('customer.png' , 70, 645, {align:'left',width:90,length:90})
        pdfDoc.image('TwentyFive-Logo-nomal.png' , 230,635, {align: 'center',width:180,length:180} )
        pdfDoc.image('powered-by-senseaition.png' , 388 , 645, {align: 'right', width:210,length:210});
        pdfDoc.end(); 

        // delete non-static images
        fs.unlinkSync('bar.png');
        fs.unlinkSync('customer.png');
        
      }) 
      }
    });

  }
});

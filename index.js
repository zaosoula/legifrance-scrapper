console.clear();
const puppeteer = require('puppeteer');
const fetch= require('node-fetch');
const fs = require('fs');
const path = require('path');

const headers = new fetch.Headers();
headers.append("Cookie", "lf-demo-consult-jorf=1; incap_ses_465_1235873=sZtwdShSYTjE/z80SAN0BqaJwl8AAAAADKwAy8KizRDDSkFq4nHGZA==; nlbi_1235873=TF57cyJWnStdt0lqGqP1/gAAAAAJ+Mtn5BYYwjRL1uQF4hy5; JSESSIONID=7324ABB607A91B44DB2E4DE538DF8294; lf-demo-accueil=1; atuserid=%7B%22name%22%3A%22atuserid%22%2C%22val%22%3A%223f70f4b8-eb62-4761-8e77-807cd04c39b6%22%2C%22options%22%3A%7B%22end%22%3A%222021-12-30T16%3A32%3A35.561Z%22%2C%22path%22%3A%22%2F%22%7D%7D; LB_APP_ROUTE=.5; LB_FRONT_ROUTE=.1.1; tarteaucitron=!id=a5c8155833511d18-109da518-8ba7e9a8-ad046228aa8818a809d23c28!atinternet=true!hotjar=false; visid_incap_1235873=/Fq2AyKJTFKXaH2qhK/cnqF7wl8AAAAAQUIPAAAAAAD5lDPPncwZkvDi60QsbGuG; xtvrn=$124093$");
headers.append("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15");

const requestOptions = {
  method: 'GET',
  headers: headers,
  redirect: 'follow'
};


(async () => {

  let today = new Date();

  console.log(today);

  if (!fs.existsSync('jo')) fs.mkdirSync('jo');

  let url = `https://www.legifrance.gouv.fr/jorf/jo/${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}/`

  let regexNoResult = new RegExp("Nous n'avons trouvé aucun résultat à votre recherche\\.");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log('Loading...')
  await page.goto(url);

  let pagecontent = await page.content();
  
  let hasResult = !regexNoResult.test(pagecontent);

  if (!hasResult) return console.log('No result for this date');

  let links = await page.evaluate(async () => {
    let links = [];
    document.querySelectorAll("a[href]").forEach((a)=> {
      links.push(a.href);
    });
    return links;
  });



  links = links.filter((link)=>{
    return link.startsWith('https://www.legifrance.gouv.fr/download/pdf?id=');
  })

  console.log(`${links.length} links found`)

  for (const link of links) {
    await page.goto(link);

    let downloadLink = await page.evaluate(()=>{
      return document.querySelector('.doc-download').href;
    });

    let downloadPath = path.join(__dirname, 'jo', `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}.pdf`);
    if(!fs.existsSync(downloadPath)) {
      let res = await fetch(downloadLink, requestOptions);
      
      const fileStream = fs.createWriteStream(downloadPath);
    
      res.body.pipe(fileStream);
      res.body.on("error", (err) => {
        console.log(`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}.pdf: Error during dowload`, err);
      });
      fileStream.on("finish", function() {
        console.log(`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}.pdf: Downloaded`);
      });
    }else{
      console.log(`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}.pdf: Already downloaded`);
    }

  }

  await browser.close();


})();
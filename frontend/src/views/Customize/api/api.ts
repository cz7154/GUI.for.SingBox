import { Requests } from '@/bridge'
import { RequestMethod } from '@/enums/app'

const bastUrl = 'https://admin.czvps.top/api'

export const captcha = async () => {
  const { headers: h, body: b } = await Requests({
    method: RequestMethod.Post,
    url: bastUrl + '/base/captcha',
    // headers: s.header.request,
    autoTransformBody: false,
    options: {
      Insecure: false,
      Timeout: 15,
    },
  })
 return JSON.parse(b)
  
}
  //  const data = {"username":"admin","password":"jhsdfi8521!@#$.","captcha":"353903","captchaId":"hVUej0g9uaXzq8oDOFCT","openCaptcha":true}

export const login = async (data: any) => {
  const { headers: h, body: b } = await Requests({
    method: RequestMethod.Post,
    url: bastUrl + '/base/login',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    autoTransformBody: false,
    options: {
      Insecure: false,
      Timeout: 15,      
    },
  })
 return JSON.parse(b)
//   await fetch(bastUrl + '/base/login', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify(data)
// })
}
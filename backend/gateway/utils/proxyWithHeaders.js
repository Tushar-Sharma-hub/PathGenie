// Sending data into headers using this fxn. Which can help other services to get current user id from headers.
import proxy from "express-http-proxy"

export const proxyWithHeaders = (serviceUrl)=> {
    return proxy(
        serviceUrl,
        {
            proxyReqOptDecorator:(proxyReqOpts,srcReq) =>{
                if(srcReq.user){
                    proxyReqOpts.headers["x-user-id"]=srcReq.user.userId
                }
                return proxyReqOpts
            }
        }
    )
}
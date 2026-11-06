const jwt = require('jsonwebtoken');




function checkGateToken(req,res,next){
    try {
        const gateHeader = req.headers['x-gate-token'];
        if(!gateHeader){
            return res.status(403).json({message:'Доступ запрещён!'})
        }

        const token = gateHeader.startsWith('Bearer ')
        ? gateHeader.split(' ')[1]: gateHeader;
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded.gatePassed||decoded.scope!=='admin_gate_access'){
            return res.status(403).json({message:'Недействительный пропуск!'})
        }
        next();
    } catch (error) {
        if(error.name==='TokenExpiredError'){
            return res.status(403).json({message:'Время действие пропуска истекло!'});

        }
        return res.status(403).json({message:'Ошибка проверки пропуска!'})
    }
}
module.exports = checkGateToken;
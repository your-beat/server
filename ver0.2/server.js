//server.js

'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(bodyParser.json());
const app = new SmartApp()
const mysql = require('mysql');
const admin = require('firebase-admin');

//--------------------------------------------------------전역변수--------------------------------------------------------//
const stateStorage = {}; //재실 감지 센서의 상태를 저장하는 변수. 'present': 재실 중. 'not present': 재실 중 x

//--------------------------------------------------------initialize--------------------------------------------------------//
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL Database!');
});

// Firebase Admin SDK 초기화 (푸시 알림을 위해)
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});


//--------------------------------------------------------함수--------------------------------------------------------//
// UTC에서 KST로 변환하는 함수
function convertUtcToKst(timestamp) {
    const utcDate = new Date(timestamp);
    const kstOffset = 9 * 60; // KST는 UTC+9
    utcDate.setMinutes(utcDate.getMinutes() + kstOffset);
    return utcDate;
  }

  // MySQL에 저장하기 위한 형식으로 변환하는 함수
function toMysqlFormat(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

//--------------------------------------------------------API 및 푸시 알림 관련 코드--------------------------------------------------------//

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    app.handleHttpCallback(req, res);
});

// 디바이스 정보 요청 API
server.get('/devices', async (req, res) => {
    try {
        const devices = await app.api.devices.list();
        res.json(devices);
    } catch (error) {
        console.error('디바이스 정보 조회 실패:', error);
        res.status(500).send('Internal Server Error');
    }
});
// fcm 토큰 저장 API
server.post('/fcm', async(req,res)=>{
    try{
        const fcmToken = req.body.fcmToken;
        const userId = context.installationId;
        const query = 'INSERT INTO fcm (fcmToken,installationId) VALUES (?,?)';
        connection.query(query, [fcmToken,userId], (error, results, fields) => {
        if (error) throw error;
        console.log('Inserted data with ID:', results.insertId);
        });
    } catch (error) {
        console.error('fcm 토큰 저장 실패:', error);
        res.status(500).send('Internal Server Error');
    }
})

// 외출 모드 활성화 시 푸시 알림 전송
async function sendPushNotificationForAwayMode(userId) {
    currentTime= new Date();
    query = 'SELECT fcmToken FROM fcm WHERE userId = ?';
    connection.query(query,[userId], (error, results, fields) => {
        if (error) throw error;
        fcmToken = results[0].fcmToken;
    });
    const message = {
        notification: {
            type: 0, // 0: 일반 알림, 1: 이상감지 알림
            title: '외출 모드 활성화',
            body: '외출 모드가 활성화되었습니다.',
            time: currentTime.toLocaleTimeString()
        },
        token: fcmToken // 사용자의 FCM 토큰
    };

    await admin.messaging().send(message)
        .then((response) => {
            console.log('푸시 알림 성공:', response);
        })
        .catch((error) => {
            console.error('푸시 알림 실패:', error);
        });
}

// 화장실 이상 감지 시 푸시 알림 전송
async function sendPushNotificationForToiletAlertLongUsing(userId) {
    query = 'SELECT fcmToken FROM fcm WHERE userId = ?';
    connection.query(query,[userId], (error, results, fields) => {
        if (error) throw error;
        fcmToken = results[0].fcmToken;
    });
    const message = {
        notification: {
            type: 1, // 0: 일반 알림, 1: 이상감지 알림
            title: '화장실 이상 감지',
            body: '화장실을 너무 오래 사용하는 이상 감지가 발생했습니다.',
            time: currentTime.toLocaleTimeString()
        },
        token: fcmToken // 사용자의 FCM 토큰
    };

    await admin.messaging().send(message)
        .then((response) => {
            console.log('푸시 알림 성공:', response);
        })
        .catch((error) => {
            console.error('푸시 알림 실패:', error);
        });
}
async function sendPushNotificationForToiletAlertLongUnusing(userId) {
    query = 'SELECT fcmToken FROM fcm WHERE userId = ?';
    connection.query(query,[userId], (error, results, fields) => {
        if (error) throw error;
        fcmToken = results[0].fcmToken;
    });
    const message = {
        notification: {
            type: 1, // 0: 일반 알림, 1: 이상감지 알림
            title: '화장실 이상 감지',
            body: '화장실을 너무 오래 사용하지 않는 이상 감지가 발생했습니다.',
            time: currentTime.toLocaleTimeString()
        },
        token: fcmToken // 사용자의 FCM 토큰
    };

    await admin.messaging().send(message)
        .then((response) => {
            console.log('푸시 알림 성공:', response);
        })
        .catch((error) => {
            console.error('푸시 알림 실패:', error);
        });
}

//--------------------------------------------------------SmartThings 관련 코드--------------------------------------------------------//
/* Defines the SmartApp */
app.enableEventLogging()
    .configureI18n()
    .page('mainPage', (context, page, configData) => {
        page.section('doorSensors', section => {
           section.deviceSetting('doorSensor').capabilities(['contactSensor']).required(true);
        });
        page.section('presenceSensors', section => {
            section.deviceSetting('presenceSensor').capabilities(['presenceSensor']).required(true);
        });
        page.section('smartPlugs', section => {
            section.deviceSetting('smartPlug').capabilities(['switch']).multiple(true).permissions('rx');
        });
    })
    .updated(async (context, updateData) => { //앱이 업데이트 되었을때마다 구독을 취소하고 다시 구독을 추가
        await context.api.subscriptions.unsubscribeAll();
        return Promise.all([
            //현관문 센서 구독 추가
            context.api.subscriptions.subscribeToDevices(context.config.doorSensor, 'contactSensor', 'contact.open', 'doorOpenHandler'),
            //모션 감지 센서 구독 추가
            context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'presenceSensor', 'presence.present', 'presenceActiveHandler'),
            context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'presenceSensor', 'presence.not present', 'presenceInactiveHandler')
        ])
    })
    //doorOpenHandler는 현관문이 열렸을 때 10분간의 타이머를 발동시키고, 'presenceState'의 stateStorage를 'not present'로 초기화한 뒤, 10분동안의 재실감지센서의 작동을 presenceActiveHandler를 통해 관찰한다.(presenceActiveHandler는 재실감지센서가 작동하면 'presenceState'의 stateStorage를 'present'로 바꾸어준다.) 10분이 지나면 outgoingHandler를 발동시킨다.
    .subscribedEventHandler('doorOpenHandler', async (context, deviceEvent) => {
        setTimeout(async () => { //문이 열리고, 15초 뒤의 재실 상황을 '초기 재실 상황'으로 설정
            context.api.schedules.runIn('outgoingHandler',10); //600초 = 10분
            const presenceSensorStatus = await context.api.devices.getCapabilityStatus(context.config.presenceSensor[0].deviceConfig.deviceId, 'main', 'presenceSensor');
            if (presenceSensorStatus.presence.value === 'present') {
                stateStorage[context.installationId] = { presenceState: 'present' }; // 만약 처음부터 재실 상태라면, stateStorage를 'present'로 설정 (외출모드 실행 x)
            } else {
                stateStorage[context.installationId] = { presenceState: 'not present' }; // 만약 처음부터 재실 상태가 아니라면, stateStorage를 'not present'로 설정
            }
        }, 15000);
    })
    //presenceActiveHandler는 재실 감지 센서의 presence.present의 값이 바뀌면 발동되며, presence.present의 값이 'present'라면 재실 감지 센서의 stateStorage를 'present'로 바꾼다.
    .subscribedEventHandler('presenceActiveHandler',async (context, deviceEvent) => {
        if(deviceEvent.value == 'present'){ //외출모드를 위한 코드
            stateStorage[context.installationId] = { presenceState: 'present' }; 
        }
        //재실감지 센서가 작동하면, 해당 timeStamp를 stateStorage에 저장한다.
        // API 호출 결과
        const apiResult = await context.api.devices.getCapabilityStatus(context.config.presenceSensor[0].deviceConfig.deviceId, 'main', 'presenceSensor');
        const timestamp = apiResult.presence.timestamp;
        const status= apiResult.presence.value;

        // UTC를 KST로 변환하고 MySQL 형식으로 조정
        const kstTimestamp = toMysqlFormat(convertUtcToKst(timestamp));

        // MySQL에 데이터 삽입
        const query = 'INSERT INTO toilet_presence_sensor (status,timestamp) VALUES (?,?)';
        connection.query(query, [status,kstTimestamp], (error, results, fields) => {
        if (error) throw error;
        console.log('Inserted data with ID:', results.insertId);
        });
        // MySQL의 toilet_presence_sensor 테이블의 마지막 행 id를 가져온다.
        const query2 = 'SELECT id FROM toilet_presence_sensor ORDER BY id DESC LIMIT 1';
        connection.query(query2, (error, results, fields) => {
        if (error) throw error;
        const lastId = results[0].id;
        console.log('Last id:', lastId);
        }
        );
        //1시간동안 재실감지 센서가 작동해있다면, 사용자 이상 감지 푸시 알림을 보낸다.
        setTimeout(async () => {
            connection.query(query2, (error, results, fields) => {
                if(error) throw error;
                const currentId= results[0].id;
                console.log('Current id:', currentId);
            });
            if (currentId===lastId){
                sendPushNotificationForToiletAlertLongUsing(context.installationId);
            }
        }, 3600000); //3600000ms = 1시간
    })
    .subscribedEventHandler('presenceInactiveHandler', async(context, deviceEvent) => {
        // API 호출 결과
        const apiResult = await context.api.devices.getCapabilityStatus(context.config.presenceSensor[0].deviceConfig.deviceId, 'main', 'presenceSensor');
        const timestamp = apiResult.presence.timestamp;
        const status= apiResult.presence.value;

        // UTC를 KST로 변환하고 MySQL 형식으로 조정
        const kstTimestamp = toMysqlFormat(convertUtcToKst(timestamp));

        // MySQL에 데이터 삽입
        const query = 'INSERT INTO toilet_presence_sensor (status,timestamp) VALUES (?,?)';
        connection.query(query, [status,kstTimestamp], (error, results, fields) => {
        if (error) throw error;
        console.log('Inserted data with ID:', results.insertId);
        });
        // MySQL의 toilet_presence_sensor 테이블의 마지막 행 id를 가져온다.
        const query2 = 'SELECT id FROM toilet_presence_sensor ORDER BY id DESC LIMIT 1';
        connection.query(query2, (error, results, fields) => {
        if (error) throw error;
        const lastId = results[0].id;
        console.log('Last id:', lastId);
        }
        );
        //10시간동안 재실감지 센서가 작동하지 않았있다면, 사용자 이상 감지 푸시 알림을 보낸다.
        setTimeout(async () => {
            connection.query(query2, (error, results, fields) => {
                if(error) throw error;
                const currentId= results[0].id;
                console.log('Current id:', currentId);
            });
            if (currentId===lastId){
                sendPushNotificationForToiletAlertLongUnusing(context.installationId);
            }
        }, 36000000); //36000000ms = 10시간
    })

    //outgoingHandler는 현관문이 열린 지 10분이 지나면 발동되며, 재실 감지 센서의 stateStorage가 'present'라면 사용자의 smartthings와 연결된 모든 디바이스의 전원을 off한다. stateStorage가 'not present' 라면 아무것도 하지 않는다.
    app.scheduledEventHandler('outgoingHandler', async (context, deviceEvent) => {
        const presenceState = stateStorage[context.installationId].presenceState;
        if (presenceState === 'present') {
            sendPushNotificationForAwayMode(context.installationId);
            const devices = await context.api.devices.list();
            for (const device of devices) {
                if (device.label === 'Aqara Smart Plug 1'){
                    try {
                        await context.api.devices.sendCommands(context.config.smartPlug, 'switch', 'off');
                    } catch (error) {
                        console.error('명령 전송 실패:', error);
                    }
                }
            }
        }
    });

//--------------------------------------------------------서버 실행 코드--------------------------------------------------------//
let port = process.env.PORT;
server.listen(port);
console.log(`Open: http://127.0.0.1:${port}`);

//server.js

const stateStorage = {}; //재실 감지 센서의 상태를 저장하는 변수. 'present': 재실 중. 'not present': 재실 중 x


'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const SmartApp = require('@smartthings/smartapp');

const server = module.exports = express();
server.use(bodyParser.json());

const app = new SmartApp()

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Simple SmartApp Example URL: https://'+ req.hostname);
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    app.handleHttpCallback(req, res);
});

/* Defines the SmartApp */
app.enableEventLogging()  // Log and pretty-print all lifecycle events and responses
    .configureI18n()      // Use files from locales directory for configuration page localization
    .page('mainPage', (context, page, configData) => {
        page.section('doorSensors', section => {
           section.deviceSetting('doorSensor').capabilities(['contactSensor']).required(true);
        });
        page.section('presenceSensors', section => {
            section.deviceSetting('presenceSensor').capabilities(['presenceSensor']).required(true);
        });
    })
    .updated(async (context, updateData) => { //앱이 업데이트 되었을때마다 구독을 취소하고 다시 구독을 추가
        await context.api.subscriptions.unsubscribeAll();

        return Promise.all([ 
            //현관문 센서 구독 추가
            context.api.subscriptions.subscribeToDevices(context.config.doorSensor, 'contactSensor', 'contact.open', 'doorOpenHandler'),
            //모션 감지 센서 구독 추가
            context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'presenceSensor', 'presence.present', 'presenceActiveHandler')
        ])
    })
    //doorOpenHandler는 현관문이 열렸을 때 10분간의 타이머를 발동시키고, 'presenceState'의 stateStorage를 'not present'로 초기화한 뒤, 10분동안의 재실감지센서의 작동을 presenceActiveHandler를 통해 관찰한다.(presenceActiveHandler는 재실감지센서가 작동하면 'presenceState'의 stateStorage를 'present'로 바꾸어준다.) 10분이 지나면 outgoingHandler를 발동시킨다.
    .subscribedEventHandler('doorOpenHandler', async (context, deviceEvent) => {
        context.api.schedules.runIn('outgoingHandler',10);
        const presenceSensorStatus = await context.api.devices.getCapabilityStatus(context.config.presenceSensor[0].deviceConfig.deviceId, 'main', 'presenceSensor');
        if (presenceSensorStatus.presence.value === 'present') {
            stateStorage[context.installationId] = { presenceState: 'present' };
        } else {
            stateStorage[context.installationId] = { presenceState: 'not present' };
        }
        console.log(`[doorOpenHandler] State updated: ${JSON.stringify(stateStorage[context.installationId])}`);
    })
    //presenceActiveHandler는 재실 감지 센서의 presence.present의 값이 바뀌면 발동되며, presence.present의 값이 'present'라면 재실 감지 센서의 stateStorage를 'present'로 바꾼다.
    .subscribedEventHandler('presenceActiveHandler', (context, deviceEvent) => {
        if(deviceEvent.value == 'present'){
            stateStorage[context.installationId] = { presenceState: 'present' };
            console.log(`[presenceActiveHandler] State updated: ${JSON.stringify(stateStorage[context.installationId])}`);
        }
    })

    //outgoingHandler는 현관문이 열린 지 10분이 지나면 발동되며, 재실 감지 센서의 stateStorage가 'present'라면 사용자의 smartthings와 연결된 모든 디바이스의 전원을 off한다. stateStorage가 'not present' 라면 아무것도 하지 않는다.
    .subscribedEventHandler('outgoingHandler', async (context, deviceEvent) => {
        // 현관문이 열린 지 10분 후 실행되는 핸들러입니다.
        const presenceState = stateStorage[context.installationId].presenceState;
        console.log(`[outgoingHandler] Checking state: ${JSON.stringify(stateStorage[context.installationId])}`);
        if (presenceState === 'present') {
            // 연결된 모든 디바이스의 목록을 가져옵니다.
            const devices = await context.api.devices.list();
            // 각 디바이스에 대해 'off' 커맨드를 보냅니다.
            for (const device of devices) {
                if (device.components.main.capabilities.switch) {
                    // 디바이스가 스위치 기능을 지원하는 경우에만 커맨드를 보냅니다.
                    await context.api.devices.sendCommands(device.deviceId, 'switch', 'off');
                }
            }
        }
    });

    app.scheduledEventHandler('outgoingHandler', async (context, event) => {
        // 타이머 이벤트에 대한 처리 로직
    });

/* Starts the server */
let port = process.env.PORT;
server.listen(port);
console.log(`Open: http://127.0.0.1:${port}`);

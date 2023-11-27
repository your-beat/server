import requests
import json

def get_data_with_bearer_token(api_url, bearer_token):
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'  # 필요에 따라 content type을 설정하세요
    }

    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()  # HTTP 오류가 발생하면 예외를 발생시킵니다.

        # 응답 데이터를 가져옵니다.
        data = response.json()
        return data

    except requests.exceptions.HTTPError as err:
        print(f"HTTP 오류 발생: {err}")
    except Exception as e:
        print(f"오류 발생: {e}")

# API url
device_list = 'https://api.smartthings.com/v1/devices' # device 목록
device_status = 'https://api.smartthings.com/v1/devices/{device_id}/status' # 특정device 상태
get_scenes = 'https://api.smartthings.com/v1/scenes' # Scene 목록

get_capabilities = 'https://api.smartthings.com/v1/capabilities' # 기능 목록

# OAuth 토큰
bearer_token = '655f67e6-52b0-4929-ab98-023f0684c324'

result = get_data_with_bearer_token(get_capabilities, bearer_token)

print(result)  # 가져온 데이터 출력

# 데이터 json으로 저장
with open("get_capabilities.json", 'w', encoding = 'utf-8') as json_file:
  json.dump(result, json_file)
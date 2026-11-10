# vendor.api — справочник REST API

Актуально для модуля `vendor.api` версии `1.2.0`. Версия справочника — `1.3.0`.

Базовый URL: `https://smartclearing.ru/api`

Для передачи во внешний репозиторий приложения используйте разделы
[Авторизация](#авторизация), [Текущие методы](#текущие-методы),
[Формат ошибок](#формат-ошибок) и
[Интеграция с внешним приложением](#интеграция-с-внешним-приложением).

## Содержание

- [Установка и настройка](#установка-и-настройка)
- [Авторизация](#авторизация)
- [Текущие методы](#текущие-методы)
  - [GET /api/health](#get-apihealth)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [POST /api/auth/refresh](#post-apiauthrefresh)
  - [GET /api/auth/me](#get-apiauthme)
  - [POST /api/push-tokens](#post-apipush-tokens)
  - [DELETE /api/push-tokens](#delete-apipush-tokens)
  - [GET /api/cities](#get-apicities)
  - [GET /api/cities/{cityId}/houses](#get-apicitiescityidhouses)
  - [GET /api/houses/{houseId}/podjezdy](#get-apihouseshouseidpodjezdy)
  - [GET /api/podjezdy/{podjezdId}/etazhi](#get-apipodjezdypodjezdidetazhi)
  - [GET /api/etazhi/{etazhId}/places](#get-apietazhietazhidplaces)
  - [POST /api/photos](#post-apiphotos)
  - [GET /api/examples](#get-apiexamples)
  - [GET /api/examples/{id}](#get-apiexamplesid)
  - [POST /api/examples](#post-apiexamples)
  - [PUT /api/examples/{id}](#put-apiexamplesid)
  - [PATCH /api/examples/{id}](#patch-apiexamplesid)
  - [DELETE /api/examples/{id}](#delete-apiexamplesid)
- [Формат ошибок](#формат-ошибок)
- [Интеграция с внешним приложением](#интеграция-с-внешним-приложением)
- [Обработка параметров](#обработка-параметров)
- [Валидация](#валидация)
- [Как добавить метод](#как-добавить-метод)
- [Настройки](#настройки)
- [Маршрутизация и деплой](#маршрутизация-и-деплой)
- [Сопровождение документации](#сопровождение-документации)

## Установка и настройка

1. Модуль лежит в `www/local/modules/vendor.api`.
2. Компонент-точка входа — `www/local/components/vendor/api.rest`.
3. Открыть в админке **Настройки → Модули** и установить **Vendor REST API**.
4. При установке автоматически создаётся JWT-секрет.
5. Проверить параметры: **Настройки → Настройки продукта → Настройки модулей
   → Vendor REST API**.
6. Точка входа `/api/` — `www/api/index.php`; для Apache используется
   `www/api/.htaccess`.

## Авторизация

Токен передаётся в заголовке:

```http
Authorization: Bearer <JWT>
```

JWT подписывается алгоритмом HS256. В токене есть claims:

| Claim | Назначение |
|---|---|
| `sub` | ID пользователя Bitrix |
| `login` | логин |
| `email` | email |
| `name` | имя и фамилия |
| `groups` | массив ID групп Bitrix |
| `scopes` | необязательные scopes для `#[Auth(scopes: [...])]` |
| `iat`, `nbf`, `exp` | время выпуска, начало и конец действия |
| `iss` | issuer из настроек |
| `jti` | уникальный ID токена |

Проверяются подпись, `exp`, `nbf`, `iat` и `iss`. Время жизни по умолчанию —
3600 секунд.

В контроллерах авторизация задаётся атрибутом:

```php
#[Auth]                              // обязательный JWT
#[Auth(required: false)]             // JWT не обязателен
#[Auth(scopes: ['orders.write'])]    // обязательный JWT + scopes
```

Без `#[Auth]` метод публичный. Для проверки scopes в токене должен быть claim
`scopes` — массив или строка через пробел/запятую. Встроенный
`POST /api/auth/login` scopes не выставляет; если они нужны, добавьте claim в
своём выпуске токена.

## Текущие методы

| Метод | Путь | Авторизация | Назначение |
|---|---|---|---|
| GET | `/api/health` | нет | проверка доступности |
| POST | `/api/auth/login` | нет | вход и выдача access/refresh-токенов |
| POST | `/api/auth/refresh` | нет | обновление access-токена по refresh-токену |
| GET | `/api/auth/me` | да | claims текущего токена |
| POST | `/api/push-tokens` | да | регистрация Expo push-токена устройства |
| DELETE | `/api/push-tokens` | да | удаление push-токена устройства |
| GET | `/api/cities` | да | список городов |
| GET | `/api/cities/{cityId}/houses` | да | дома города, доступные пользователю |
| GET | `/api/houses/{houseId}/podjezdy` | да | подъезды дома |
| GET | `/api/podjezdy/{podjezdId}/etazhi` | да | этажи подъезда |
| GET | `/api/etazhi/{etazhId}/places` | да | места на этаже |
| POST | `/api/photos` | да | загрузка фотоотчёта |
| GET | `/api/examples` | нет | демонстрационный список |
| GET | `/api/examples/{id}` | нет | демонстрационная запись |
| POST | `/api/examples` | да | демонстрационное создание |
| PUT | `/api/examples/{id}` | да | демонстрационная замена |
| PATCH | `/api/examples/{id}` | да | демонстрационное обновление |
| DELETE | `/api/examples/{id}` | да | демонстрационное удаление |

`UPDATE` — псевдоним `PATCH`: его можно указать в `#[Route(methods: ['UPDATE'])]`
или отправить HTTP-методом `UPDATE` / через `X-HTTP-Method-Override: UPDATE`.
Внутри запрос приводится к `PATCH`.

`/api/examples` — демонстрационный контроллер
`www/local/api/Controllers/ExampleController.php`. Он хранит данные в статическом
массиве: изменения не сохраняются между запросами. Замените его своей логикой
или удалите. Демонстрационные записи существуют только с ID `1` и `2`.

### GET /api/health

Проверка доступности API.

Авторизация: нет.

Ответ `200`:

```json
{
  "status": "ok",
  "time": "2026-11-06T06:00:00+00:00",
  "version": "1.0.0"
}
```

### POST /api/auth/login

Вход по логину и паролю Bitrix. После проверки пользователь разлогинивается,
API остаётся stateless.

Авторизация: нет.

Тело запроса (JSON или form-urlencoded):

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `login` | string | да | до 255 символов |
| `password` | string | да | до 255 символов |

Пример:

```bash
curl -i -X POST https://smartclearing.ru/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"admin","password":"secret"}'
```

Ответ `200`:

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2026-11-06T07:00:00+00:00",
  "refresh_token": "eyJ...",
  "refresh_expires_in": 2592000,
  "refresh_expires_at": "2026-12-06T07:00:00+00:00",
  "user": {
    "id": 1,
    "login": "admin",
    "email": "admin@example.com",
    "name": "Администратор"
  }
}
```

`access_token` живёт `jwt_ttl` секунд (по умолчанию 3600), `refresh_token` —
`jwt_refresh_ttl` секунд (по умолчанию 30 дней). Refresh-токен передаётся
только на `POST /api/auth/refresh` и не принимается как Bearer-токен.

Ошибки:

| Код | Причина |
|---|---|
| `401` | неверный логин или пароль |
| `422` | не переданы или неверны `login`/`password` |

### POST /api/auth/refresh

Обменивает действующий refresh-токен на новый access-токен. Refresh-токен
не ротируется и действует до `refresh_expires_at`.

Авторизация: нет.

Тело запроса (JSON или form-urlencoded):

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `refresh_token` | string | да | до 4096 символов |

Пример:

```bash
curl -i -X POST https://smartclearing.ru/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token":"eyJ..."}'
```

Ответ `200`:

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2026-11-06T08:00:00+00:00",
  "user": {
    "id": 1,
    "login": "admin",
    "email": "admin@example.com",
    "name": "Администратор"
  }
}
```

Ошибки:

| Код | Причина |
|---|---|
| `401` | refresh-токен отсутствует, просрочен или недействителен |
| `422` | не передан `refresh_token` |

### GET /api/auth/me

Возвращает данные текущего токена.

Авторизация: обязательный JWT.

Пример:

```bash
curl -i https://smartclearing.ru/api/auth/me \
  -H 'Authorization: Bearer <token>'
```

Ответ `200`:

```json
{
  "data": {
    "id": 1,
    "claims": {
      "sub": "1",
      "login": "admin",
      "email": "admin@example.com",
      "name": "Администратор",
      "groups": [1],
      "iat": 1780000000,
      "nbf": 1780000000,
      "exp": 1780003600,
      "iss": "vendor.api",
      "jti": "..."
    }
  }
}
```

### POST /api/push-tokens

Регистрирует Expo push-токен устройства за текущим пользователем. Повторная
регистрация того же токена обновляет владельца и платформу.

Авторизация: обязательный JWT.

Тело запроса:

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `token` | string | да | до 255 символов |
| `platform` | string | да | `ios` или `android` |

Ответ `201`:

```json
{ "status": "ok" }
```

### DELETE /api/push-tokens

Удаляет Expo push-токен устройства текущего пользователя (например, при выходе
из аккаунта или отключении уведомлений).

Авторизация: обязательный JWT.

Тело запроса:

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `token` | string | да | до 255 символов |

Ответ: `204 No Content`.

### Справочники мест и фотоотчёты

Методы работают с хайлоад-блоками проекта. Все они требуют JWT:

```http
Authorization: Bearer <JWT>
```

| Ресурс | HL-блок | Константа | Источник данных |
|---|---|---|---|
| Города | `CITIES_HL_ID` (1) | `CITIES_HL_ID` | `UF_NAME` |
| Дома | `HOUSES_HL_ID` (2) | `HOUSES_HL_ID` | `UF_CITY_ID`, `UF_ADDRESS_STRING` |
| Подъезды | `PODJEZDY_HL_ID` (3) | `PODJEZDY_HL_ID` | `UF_HOUSE_ID`, `UF_NAME` |
| Этажи | `ETAZHI_HL_ID` (4) | `ETAZHI_HL_ID` | `UF_PODJEZD_ID`, `UF_NAME` |
| Места | `PLACES_HL_ID` (5) | `PLACES_HL_ID` | `UF_ETAZH_ID`, `UF_NAME` |
| Доступ к домам | `USERSTOHOUSES_HL_ID` (7) | `USERSTOHOUSES_HL_ID` | `UF_USER_ID`, `UF_HOUSE_ID` |
| Фотоотчёты | `PHOTOS_HL_ID` (8) | `PHOTOS_HL_ID` | поля фотоотчёта |

Правила доступа:

- список домов города ограничен домами текущего пользователя из
  `USERSTOHOUSES_HL_ID`;
- вложенные методы (подъезды, этажи, места, загрузка фото) проверяют, что
  родительская цепочка существует и что дом доступен пользователю;
- если запись не найдена или дом недоступен, возвращается `404` — без
  раскрытия причины;
- если переданные ID не образуют цепочку (место не относится к этажу и т.п.),
  возвращается `422` с ошибкой по конкретному полю.

Если константы не определены или HL-блок недоступен, возвращается `500` с
кодом `server_error`.

### GET /api/cities

Список городов. Сортировка по названию, затем по ID. Города возвращаются без
фильтрации по доступу: ограничение по `USERSTOHOUSES_HL_ID` применяется к списку
домов.

Авторизация: обязательный JWT.

Ответ `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Москва"
    }
  ]
}
```

### GET /api/cities/{cityId}/houses

Список домов города, доступных текущему пользователю.

Авторизация: обязательный JWT.

Path-параметр:

| Параметр | Тип | Ограничение |
|---|---|---|
| `cityId` | int | `\d+`, больше `0` |

Ответ `200`:

```json
{
  "data": [
    {
      "id": 10,
      "city_id": 1,
      "address": "г. Москва, ул. Ленина, д. 1"
    }
  ]
}
```

Если город не найден — `404`. Если у пользователя нет доступных домов в этом
городе — `data` пустой массив.

### GET /api/houses/{houseId}/podjezdy

Список подъездов дома.

Авторизация: обязательный JWT.

Path-параметр:

| Параметр | Тип | Ограничение |
|---|---|---|
| `houseId` | int | `\d+`, больше `0` |

Ответ `200`:

```json
{
  "data": [
    {
      "id": 100,
      "house_id": 10,
      "name": "Подъезд 1"
    }
  ]
}
```

Если дом не найден или недоступен пользователю — `404`.

### GET /api/podjezdy/{podjezdId}/etazhi

Список этажей подъезда.

Авторизация: обязательный JWT.

Path-параметр:

| Параметр | Тип | Ограничение |
|---|---|---|
| `podjezdId` | int | `\d+`, больше `0` |

Ответ `200`:

```json
{
  "data": [
    {
      "id": 1000,
      "podjezd_id": 100,
      "name": "1"
    }
  ]
}
```

Если подъезд не найден или дом недоступен пользователю — `404`.

### GET /api/etazhi/{etazhId}/places

Список мест на этаже.

Авторизация: обязательный JWT.

Path-параметр:

| Параметр | Тип | Ограничение |
|---|---|---|
| `etazhId` | int | `\d+`, больше `0` |

Ответ `200`:

```json
{
  "data": [
    {
      "id": 10000,
      "etazh_id": 1000,
      "name": "Место 1"
    }
  ]
}
```

Если этаж не найден или дом недоступен пользователю — `404`.

### POST /api/photos

Загрузка фотоотчёта. Запрос отправляется как `multipart/form-data`.

Авторизация: обязательный JWT.

Поля запроса:

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `photo` | file | да | `jpg`, `jpeg`, `png`, `webp`, `heic`, `heif`; до 20 МБ |
| `house_id` | int | да | ID дома |
| `podjezd_id` | int | да | ID подъезда |
| `etazh_id` | int | да | ID этажа |
| `place_id` | int | да | ID места |
| `comment` | string | нет | до 2000 символов |
| `created_at` | string | нет | дата съёмки; по умолчанию текущее время сервера |

Значения `house_id`, `podjezd_id`, `etazh_id`, `place_id` должны образовать
существующую цепочку «дом → подъезд → этаж → место», а дом должен быть доступен
пользователю.

Пример:

```bash
curl -i -X POST https://smartclearing.ru/api/photos \
  -H 'Authorization: Bearer <token>' \
  -F 'photo=@/path/to/photo.jpg' \
  -F 'house_id=10' \
  -F 'podjezd_id=100' \
  -F 'etazh_id=1000' \
  -F 'place_id=10000' \
  -F 'comment=Светильник не работает' \
  -F 'created_at=2026-11-06T14:30:00+03:00'
```

Ответ `201`:

```json
{
  "data": {
    "id": 500,
    "house_id": 10,
    "podjezd_id": 100,
    "etazh_id": 1000,
    "place_id": 10000,
    "comment": "Светильник не работает",
    "upload_date": "2026-11-06T17:00:00+03:00",
    "create_date": "2026-11-06T14:30:00+03:00",
    "photo": {
      "id": 321,
      "url": "/upload/smartclearing/photos/abc123.jpg"
    }
  }
}
```

`upload_date` — время приёма записи сервером. `create_date` — время съёмки из
`created_at` или время приёма, если поле не передано. `photo.url` — путь
относительно корня сайта.

Ошибки:

| Код | Причина |
|---|---|
| `400` | не удалось сохранить файл или запись |
| `401` | нет или неверный JWT |
| `404` | дом, подъезд, этаж или место не найдены; дом недоступен |
| `422` | нет обязательного поля, неверный тип, превышен размер, неподдерживаемый формат, нарушена цепочка ID |
| `500` | не определены константы или HL-блоки недоступны |

### GET /api/examples

Демонстрационный список.

Авторизация: нет.

Query-параметры:

| Параметр | Тип | По умолчанию | Поведение |
|---|---|---|---|
| `limit` | int | `20` | приводится к диапазону 1..100 |
| `search` | string | `''` | регистронезависимый поиск по `title` |

Ответ `200`:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Первый пример",
      "description": "Демонстрационная запись"
    }
  ],
  "meta": {
    "limit": 20,
    "search": "",
    "total": 2
  }
}
```

### GET /api/examples/{id}

Авторизация: нет.

Path-параметр `id` — целое число (`\d+`). Некорректный ID не совпадает с
маршрутом и даёт `404`.

Ответ `200`:

```json
{
  "data": {
    "id": 1,
    "title": "Первый пример",
    "description": "Демонстрационная запись"
  }
}
```

Ошибка `404`, если записи нет.

### POST /api/examples

Авторизация: обязательный JWT.

Тело запроса:

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `title` | string | да | 3..255 символов |
| `description` | string/null | нет | до 1000 символов |

Ответ `201`, заголовок `Location: /api/examples/{id}`:

```json
{
  "data": {
    "id": 3,
    "title": "Новый пример",
    "description": null,
    "created_by": 1
  }
}
```

### PUT /api/examples/{id}

Авторизация: обязательный JWT.

Полностью заменяет демонстрационную запись.

Тело запроса:

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `title` | string | да | 3..255 символов |
| `description` | string/null | нет | до 1000 символов |

Ответ `200` с обновлённой записью. Если записи нет — `404`.

### PATCH /api/examples/{id}

Авторизация: обязательный JWT.

Метод объявлен как `UPDATE`, клиент может отправить `PATCH` или `UPDATE`.

Тело запроса:

| Поле | Тип | Обязательно | Ограничения |
|---|---|---|---|
| `title` | string/null | нет | 3..255 символов |
| `description` | string/null | нет | до 1000 символов |

Нужно передать хотя бы одно не-null поле, иначе `400`. Если записи нет — `404`.

Ответ `200` с обновлённой записью.

### DELETE /api/examples/{id}

Авторизация: обязательный JWT.

Ответ `204` без тела. Если записи нет — `404`.

## Формат ошибок

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": {
      "errors": {
        "title": ["The title field is required"]
      }
    }
  }
}
```

| HTTP | `code` | Причина |
|---|---|---|
| `400` | `bad_request` | некорректный запрос или тело |
| `401` | `unauthorized` | нет/неверный/просроченный JWT |
| `403` | `forbidden` | не хватает scopes |
| `404` | `not_found` | маршрут или запись не найдены |
| `405` | `method_not_allowed` | путь есть, метод не разрешён; есть `Allow` |
| `422` | `validation_failed` | ошибки входных параметров |
| `500` | `server_error` | внутренняя ошибка |

При включённом debug в ответ добавляется блок `debug` с классом исключения,
файлом, строкой и trace. В продакшене debug должен быть выключен.

## Интеграция с внешним приложением

Раздел предназначен для передачи в репозиторий мобильного/внешнего приложения.

### Базовый адрес и версия

- Базовый URL: `https://smartclearing.ru/api`.
- Версия контракта: `1.3.0` (модуль `vendor.api` `1.2.0`).
- Формат обмена: JSON, кроме `POST /api/photos` (`multipart/form-data`).
- Кодировка: UTF-8.
- Даты: строки RFC 3339 / ISO 8601 с часовым поясом, например
  `2026-11-06T14:30:00+03:00`.

### Порядок интеграции

1. `POST /api/auth/login` — получить `access_token` и `refresh_token`.
2. Передавать access-токен в каждом запросе: `Authorization: Bearer <access_token>`.
3. При `401` вызвать `POST /api/auth/refresh` с `refresh_token` и повторить
   исходный запрос с новым access-токеном. Если refresh-токен тоже истёк,
   выполнить вход повторно.
4. `GET /api/cities` — получить города.
5. `GET /api/cities/{cityId}/houses` — получить доступные дома города.
6. `GET /api/houses/{houseId}/podjezdy` — получить подъезды.
7. `GET /api/podjezdy/{podjezdId}/etazhi` — получить этажи.
8. `GET /api/etazhi/{etazhId}/places` — получить места.
9. `POST /api/photos` — отправить фотоотчёт по выбранному месту.

Списки не поддерживают пагинацию: возвращается весь доступный набор. Если для
города нет доступных домов, возвращается пустой массив `data`, а не ошибка.

### Формат ответов

Успешный ответ со списком:

```json
{
  "data": []
}
```

Успешный ответ с одной записью:

```json
{
  "data": {}
}
```

Ответ `204` означает успешное выполнение без тела. `POST /api/photos`
возвращает `201`.

### Обработка ошибок

Тело ошибки единообразно:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": {
      "errors": {
        "photo": ["The photo field is required"]
      }
    }
  }
}
```

Рекомендации клиенту:

- `401` — очистить токен и повторить вход;
- `403` — показать сообщение о недостатке прав;
- `404` — обновить справочники и повторить выбор;
- `422` — показать ошибки по полям `error.details.errors`;
- `5xx` — повторить позже, не очищая токен.

### Требования к окружению

- На сервере должны быть установлены модули `main` и `highloadblock`.
- Константы `CITIES_HL_ID`, `HOUSES_HL_ID`, `PODJEZDY_HL_ID`,
  `ETAZHI_HL_ID`, `PLACES_HL_ID`, `USERSTOHOUSES_HL_ID`, `PHOTOS_HL_ID`
  должны быть определены.
- Загрузка файлов требует доступного каталога `/upload/` и достаточного
  значения `upload_max_filesize` / `post_max_size` (не меньше 20 МБ для фото).
- Пользователь приложения должен иметь записи в `USERSTOHOUSES_HL_ID`; без них
  список домов и вложенные методы вернут пустые данные или `404`.
- Для браузерных клиентов при необходимости настроить `cors_origins` и
  `OPTIONS`-preflight.

## Обработка параметров

Параметры берутся в порядке приоритета:

1. path (`/items/{id}`);
2. тело запроса (JSON или form-urlencoded);
3. query string.

По имени параметра метода и его типу значения приводятся автоматически:

```php
#[Route('/items/{id:\d+}', methods: ['GET'])]
public function show(int $id, string $search = '', bool $active = false): array
{
    // $id — из path, $search и $active — из query/body
}
```

Поддерживаются `int`, `float`, `bool`, `string`, `array`, nullable-типы и
backed enum. Дополнительно можно внедрить:

- `Vendor\Api\Http\Request` — доступ к query/body/headers/files;
- `Vendor\Api\Auth\AuthContext` — claims текущего JWT.

Если обязательный параметр не передан или имеет неверный тип (при совпавшем
маршруте) — `422`.

## Валидация

В контроллере доступен метод `$this->validate($request, $rules)`:

```php
$data = $this->validate($request, [
    'title' => 'required|string|min:3|max:255',
    'email' => 'required|email',
    'status' => 'nullable|in:new,paid,cancelled',
    'price' => 'nullable|numeric|min:0',
    'code' => 'required|regex:/^[A-Z0-9-]+$/',
]);
```

Правила:

`required`, `nullable`, `string`, `integer`/`int`, `numeric`, `boolean`/`bool`,
`array`, `email`, `url`, `min:N`, `max:N`, `in:a,b,c`, `regex:...`, `date`,
`date_format:Y-m-d`.

Для `min`/`max`: у числовых полей сравнивается значение, у строк — длина,
у массивов — количество элементов. Валидатор возвращает только поля, описанные
в правилах.

## Как добавить метод

Создать класс в `www/local/api/Controllers` с namespace
`Local\Api\Controllers`, унаследовать `BaseController` и пометить публичные
методы атрибутами:

```php
<?php

namespace Local\Api\Controllers;

use Vendor\Api\Attribute\Auth;
use Vendor\Api\Attribute\Route;
use Vendor\Api\Auth\AuthContext;
use Vendor\Api\Controller\BaseController;
use Vendor\Api\Http\Request;
use Vendor\Api\Http\Response;

final class OrdersController extends BaseController
{
    #[Route('/orders', methods: ['GET'])]
    public function index(int $limit = 20): array
    {
        return ['data' => [], 'limit' => $limit];
    }

    #[Route('/orders/{id:\d+}', methods: ['GET'])]
    public function show(int $id): array
    {
        return ['data' => ['id' => $id]];
    }

    #[Route('/orders', methods: ['POST'])]
    #[Auth]
    public function create(Request $request, AuthContext $auth): Response
    {
        $data = $this->validate($request, [
            'title' => 'required|string|min:3|max:255',
        ]);

        return Response::json([
            'data' => array_merge($data, ['created_by' => $auth->id()]),
        ], 201);
    }

    #[Route('/orders/{id:\d+}', methods: ['UPDATE'])]
    #[Auth]
    public function update(int $id, Request $request): array
    {
        $data = $this->validate($request, [
            'title' => 'nullable|string|max:255',
        ]);

        return ['data' => ['id' => $id] + $data];
    }

    #[Route('/orders/{id:\d+}', methods: ['DELETE'])]
    #[Auth]
    public function delete(int $id): Response
    {
        return Response::noContent();
    }
}
```

Поддерживаемые HTTP-методы: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`;
`UPDATE` — псевдоним `PATCH`.

Требования:

- файл должен заканчиваться на `Controller.php`;
- класс наследует `Vendor\Api\Controller\BaseController`;
- публичные методы с `#[Route]` автоматически регистрируются;
- контроллеры ищутся в `www/local/api/Controllers` и
  `www/local/modules/vendor.api/lib/Controller`;
- один класс может содержать сколько угодно методов;
- ответ может быть массивом, объектом или `Vendor\Api\Http\Response`;
- `null` превращается в `204`.

## Настройки

| Параметр | По умолчанию | Назначение |
|---|---|---|
| `jwt_secret` | генерируется | секрет HS256 |
| `jwt_ttl` | `3600` | время жизни access-токена, секунд |
| `jwt_refresh_ttl` | `2592000` | время жизни refresh-токена, секунд |
| `jwt_issuer` | `vendor.api` | claim `iss` |
| `jwt_leeway` | `30` | допуск по времени, секунд |
| `api_prefix` | `/api` | префикс путей |
| `cors_origins` | пусто | разрешённые Origin; `*` — все |
| `debug` | `N` | детали ошибок в JSON |
| `expo_access_token` | пусто | access token Expo Push Service (опционально) |

Если `jwt_secret` пуст, используется переменная окружения
`VENDOR_API_JWT_SECRET`. Debug также можно включить через `VENDOR_API_DEBUG=1`.
Expo access token можно задать через `VENDOR_API_EXPO_ACCESS_TOKEN`.

Приложение получает Expo push-токен через `expo-notifications` и регистрирует
его в `POST /api/push-tokens`. Отправка выполняется через Expo Push Service;
для Android нужны FCM V1 credentials, для iOS — APNs key в Expo/EAS.

При непустом `cors_origins` API добавляет CORS-заголовки и отвечает на
preflight `OPTIONS` кодом `204`.

## Маршрутизация и деплой

В `docker/nginx/templates/default.conf.template` должны быть:

```nginx
location = /api {
    return 301 /api/$is_args$args;
}

location /api/ {
    try_files $uri /api/index.php?$is_args$args;
}
```

`Authorization` передаётся в PHP-FPM через:

```nginx
fastcgi_param HTTP_AUTHORIZATION $http_authorization;
```

Шаблон рендерится только при старте контейнера. После изменения шаблона
пересоздайте nginx:

```bash
cd /data/smartclearing.ru
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up -d --force-recreate nginx
```

Проверка применённого конфига:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec nginx \
  grep -R -n "location /api/" /etc/nginx/conf.d/

curl -i https://smartclearing.ru/api/health
curl -i https://smartclearing.ru/local/api/Controllers/ExampleController.php
```

Ожидается JSON от `/api/health` и `403` на `/local/api/...`.

Если меняется `api_prefix`, в nginx нужно добавить соответствующий маршрут.
Для Apache используется `www/api/.htaccess`.

## Сопровождение документации

**Правило: любое изменение API обновляет этот файл в том же изменении.**

Обновлять при изменении:

- путей и HTTP-методов;
- требований авторизации и scopes;
- входных параметров и правил валидации;
- формата ответов и кодов ошибок;
- настроек, влияющих на контракт API;
- состава встроенных контроллеров.

## Changelog

| Версия | Дата | Изменения |
|---|---|---|
| 1.3.0 | 2026-11-10 | Добавлены Expo push-уведомления: `POST`/`DELETE /api/push-tokens`, сервис отправки, ручная рассылка и автоматическое уведомление о первом фотоотчёте. |
| 1.2.0 | 2026-11-10 | Добавлены refresh-токены: `POST /api/auth/refresh`, поля `refresh_token`/`refresh_expires_*` в ответе логина и настройка `jwt_refresh_ttl`. |
| 1.1.0 | 2026-11-06 | Добавлены методы справочников (`cities`, `houses`, `podjezdy`, `etazhi`, `places`) и загрузки фотоотчёта (`photos`); описана интеграция с внешним приложением. |
| 1.0.0 | 2026-11-06 | Первичная документация: health, auth, examples; описаны JWT, параметры, валидация и маршрутизация. |

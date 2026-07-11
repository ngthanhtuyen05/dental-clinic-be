export const swaggerDocument = {
  "openapi": "3.0.0",
  "info": {
    "title": "Dental Clinic API",
    "version": "1.0.0",
    "description": "Tài liệu hướng dẫn sử dụng các APIs của Dental Clinic"
  },
  "servers": [
    {
      "url": "http://localhost:5000",
      "description": "Server Local Development"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "paths": {
    "/api/users/register": {
      "post": {
        "summary": "Đăng ký tài khoản bệnh nhân (Register)",
        "tags": ["Users"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["fullName", "phone", "email", "password", "confirmPassword"],
                "properties": {
                  "fullName": {
                    "type": "string",
                    "example": "Nguyễn Văn A"
                  },
                  "phone": {
                    "type": "string",
                    "example": "0912345678"
                  },
                  "email": {
                    "type": "string",
                    "example": "example@email.com"
                  },
                  "password": {
                    "type": "string",
                    "example": "password123"
                  },
                  "confirmPassword": {
                    "type": "string",
                    "example": "password123"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Đăng ký thành công, tự động đăng nhập và trả về Access Token + Refresh Token"
          },
          "400": {
            "description": "Dữ liệu đầu vào không hợp lệ hoặc mật khẩu xác nhận không khớp"
          }
        }
      }
    },
    "/api/users/login": {
      "post": {
        "summary": "Đăng nhập người dùng",
        "tags": ["Users"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": {
                    "type": "string",
                    "example": "dentist@example.com"
                  },
                  "password": {
                    "type": "string",
                    "example": "password123"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Đăng nhập thành công, trả về Access Token & Refresh Token"
          },
          "401": {
            "description": "Không hợp lệ"
          }
        }
      }
    },
    "/api/users/refresh-token": {
      "post": {
        "summary": "Làm mới Access Token sử dụng Refresh Token",
        "tags": ["Users"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["refreshToken"],
                "properties": {
                  "refreshToken": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Làm mới thành công, cấp Access Token & Refresh Token mới (Xoay vòng token)"
          },
          "403": {
            "description": "Refresh Token không hợp lệ hoặc hết hạn"
          }
        }
      }
    },
    "/api/users/logout": {
      "post": {
        "summary": "Đăng xuất người dùng (Hủy Refresh Token tương ứng)",
        "tags": ["Users"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["refreshToken"],
                "properties": {
                  "refreshToken": {
                    "type": "string",
                    "description": "Refresh Token cần hủy để đăng xuất session tương ứng"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Đăng xuất thành công"
          }
        }
      }
    },
    "/api/users": {
      "get": {
        "summary": "Lấy danh sách tất cả người dùng",
        "tags": ["Users"],
        "responses": {
          "200": {
            "description": "Thành công"
          }
        }
      },
      "post": {
        "summary": "Tạo người dùng mới (Admin API)",
        "tags": ["Users"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["fullName", "email", "password"],
                "properties": {
                  "fullName": {
                    "type": "string",
                    "example": "Nguyen Van A"
                  },
                  "email": {
                    "type": "string",
                    "example": "test@example.com"
                  },
                  "password": {
                    "type": "string",
                    "example": "password123"
                  },
                  "phone": {
                    "type": "string",
                    "example": "0987654321"
                  },
                  "role": {
                    "type": "string",
                    "enum": ["admin", "dentist", "staff", "patient"],
                    "example": "patient"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Tạo thành công"
          },
          "400": {
            "description": "Trùng email hoặc dữ liệu không hợp lệ"
          }
        }
      }
    },
    "/api/users/{id}": {
      "get": {
        "summary": "Lấy chi tiết thông tin một người dùng",
        "tags": ["Users"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công"
          },
          "404": {
            "description": "Không tìm thấy"
          }
        }
      },
      "patch": {
        "summary": "Cập nhật thông tin một người dùng",
        "tags": ["Users"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "fullName": {
                    "type": "string"
                  },
                  "email": {
                    "type": "string"
                  },
                  "password": {
                    "type": "string"
                  },
                  "phone": {
                    "type": "string"
                  },
                  "role": {
                    "type": "string",
                    "enum": ["admin", "dentist", "staff", "patient"]
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cập nhật thành công"
          },
          "404": {
            "description": "Không tìm thấy"
          }
        }
      },
      "delete": {
        "summary": "Xóa một người dùng",
        "tags": ["Users"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Xóa thành công"
          },
          "404": {
            "description": "Không tìm thấy"
          }
        }
      }
    },
    "/api/appointments": {
      "get": {
        "summary": "Lấy danh sách tất cả các lịch hẹn",
        "tags": ["Appointments"],
        "responses": {
          "200": {
            "description": "Thành công"
          }
        }
      },
      "post": {
        "summary": "Tạo lịch hẹn mới",
        "tags": ["Appointments"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["appointmentDate", "patientId", "dentistId"],
                "properties": {
                  "appointmentDate": {
                    "type": "string",
                    "format": "date-time",
                    "example": "2026-07-20T10:00:00Z"
                  },
                  "patientId": {
                    "type": "integer",
                    "example": 1
                  },
                  "dentistId": {
                    "type": "integer",
                    "example": 2
                  },
                  "notes": {
                    "type": "string",
                    "example": "Khám răng định kỳ"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Tạo thành công"
          },
          "400": {
            "description": "Dữ liệu không hợp lệ"
          },
          "404": {
            "description": "Không tìm thấy Bác sĩ hoặc Bệnh nhân"
          }
        }
      }
    },
    "/api/patient-profiles": {
      "post": {
        "summary": "Khởi tạo hồ sơ thông tin y tế nền cho bệnh nhân",
        "tags": ["Patient Profiles"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["userId"],
                "properties": {
                  "userId": {
                    "type": "integer",
                    "example": 1
                  },
                  "bloodType": {
                    "type": "string",
                    "example": "O+"
                  },
                  "allergies": {
                    "type": "string",
                    "example": "Dị ứng Penicillin"
                  },
                  "medicalHistory": {
                    "type": "string",
                    "example": "Huyết áp cao nhẹ"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Khởi tạo thành công"
          },
          "400": {
            "description": "Lỗi dữ liệu đầu vào hoặc hồ sơ đã tồn tại"
          }
        }
      }
    },
    "/api/patient-profiles/{userId}": {
      "get": {
        "summary": "Lấy hồ sơ thông tin y tế nền theo User ID",
        "tags": ["Patient Profiles"],
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công"
          },
          "404": {
            "description": "Chưa khởi tạo hồ sơ bệnh án"
          }
        }
      },
      "patch": {
        "summary": "Cập nhật hồ sơ thông tin y tế nền theo User ID",
        "tags": ["Patient Profiles"],
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "bloodType": {
                    "type": "string",
                    "example": "A-"
                  },
                  "allergies": {
                    "type": "string",
                    "example": "Không"
                  },
                  "medicalHistory": {
                    "type": "string",
                    "example": "Khỏe mạnh bình thường"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cập nhật thành công"
          }
        }
      }
    },
    "/api/patient-profiles/{patientProfileId}/treatments": {
      "get": {
        "summary": "Xem danh sách đợt điều trị răng miệng của Hồ sơ bệnh án",
        "tags": ["Treatment History"],
        "parameters": [
          {
            "name": "patientProfileId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công"
          }
        }
      },
      "post": {
        "summary": "Thêm đợt điều trị răng miệng mới vào Hồ sơ bệnh án",
        "tags": ["Treatment History"],
        "parameters": [
          {
            "name": "patientProfileId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["dentistId", "diagnosis", "treatment", "cost"],
                "properties": {
                  "dentistId": {
                    "type": "integer",
                    "example": 2
                  },
                  "diagnosis": {
                    "type": "string",
                    "example": "Sâu răng số 46"
                  },
                  "treatment": {
                    "type": "string",
                    "example": "Trám răng Composite"
                  },
                  "cost": {
                    "type": "number",
                    "example": 500000
                  },
                  "treatmentDate": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "notes": {
                    "type": "string",
                    "example": "Hẹn tái khám sau 6 tháng"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Thêm thành công"
          }
        }
      }
    },
    "/api/treatment-histories/{id}": {
      "get": {
        "summary": "Xem chi tiết một đợt điều trị cụ thể",
        "tags": ["Treatment History"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công"
          }
        }
      },
      "patch": {
        "summary": "Cập nhật thông tin một đợt điều trị cụ thể",
        "tags": ["Treatment History"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "diagnosis": {
                    "type": "string",
                    "example": "Sâu răng số 46 biến chứng viêm tủy"
                  },
                  "treatment": {
                    "type": "string",
                    "example": "Điều trị tủy răng và trám bọc"
                  },
                  "cost": {
                    "type": "number",
                    "example": 1500000
                  },
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cập nhật thành công"
          }
        }
      },
      "delete": {
        "summary": "Xóa đợt điều trị ra khỏi lịch sử y tế",
        "tags": ["Treatment History"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Xóa thành công"
          }
        }
      }
    },
    "/api/patients": {
      "get": {
        "summary": "Lấy danh sách bệnh nhân (có phân trang + tìm kiếm)",
        "tags": ["Patients"],
        "description": "Trả về danh sách bệnh nhân đã được format cho CMS, bao gồm thông tin User + PatientProfile + lần khám gần nhất. Hỗ trợ phân trang và tìm kiếm theo tên, email, SĐT.",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": { "type": "integer", "default": 1 },
            "description": "Trang hiện tại (bắt đầu từ 1)"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 10 },
            "description": "Số bản ghi mỗi trang (tối đa 100)"
          },
          {
            "name": "keyword",
            "in": "query",
            "schema": { "type": "string" },
            "description": "Tìm kiếm theo tên, email hoặc số điện thoại"
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công — trả về data[] + pagination{page, limit, total, totalPages}"
          },
          "401": {
            "description": "Chưa đăng nhập"
          }
        }
      },
      "post": {
        "summary": "Tạo hồ sơ bệnh nhân mới (tự động tạo User account + PatientProfile)",
        "tags": ["Patients"],
        "description": "Tạo 1 User (role=patient) + 1 PatientProfile trong cùng 1 transaction. Mật khẩu mặc định = số điện thoại.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["fullName", "email", "phone"],
                "properties": {
                  "fullName": {
                    "type": "string",
                    "example": "Nguyễn Văn Anh"
                  },
                  "email": {
                    "type": "string",
                    "example": "nguyenvananh@gmail.com"
                  },
                  "phone": {
                    "type": "string",
                    "example": "0912345678"
                  },
                  "gender": {
                    "type": "string",
                    "enum": ["male", "female", "other"],
                    "example": "male"
                  },
                  "dateOfBirth": {
                    "type": "string",
                    "format": "date",
                    "example": "1996-01-01"
                  },
                  "allergies": {
                    "type": "string",
                    "example": "Dị ứng Penicillin"
                  },
                  "chronicDiseases": {
                    "type": "string",
                    "example": "Cao huyết áp"
                  },
                  "bloodType": {
                    "type": "string",
                    "example": "O+"
                  },
                  "emergencyContactName": {
                    "type": "string",
                    "example": "Nguyễn Thị B"
                  },
                  "emergencyContactPhone": {
                    "type": "string",
                    "example": "0987654321"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Tạo hồ sơ bệnh nhân thành công (User + PatientProfile)"
          },
          "400": {
            "description": "Email đã được sử dụng hoặc dữ liệu không hợp lệ"
          }
        }
      }
    },
    "/api/patients/{id}": {
      "get": {
        "summary": "Lấy chi tiết hồ sơ một bệnh nhân",
        "tags": ["Patients"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            },
            "description": "ID của User (raw database ID)"
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công"
          },
          "404": {
            "description": "Không tìm thấy bệnh nhân"
          }
        }
      },
      "patch": {
        "summary": "Cập nhật hồ sơ bệnh nhân (User info + PatientProfile)",
        "tags": ["Patients"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "fullName": {
                    "type": "string"
                  },
                  "email": {
                    "type": "string"
                  },
                  "phone": {
                    "type": "string"
                  },
                  "gender": {
                    "type": "string",
                    "enum": ["male", "female", "other"]
                  },
                  "dateOfBirth": {
                    "type": "string",
                    "format": "date"
                  },
                  "allergies": {
                    "type": "string"
                  },
                  "chronicDiseases": {
                    "type": "string"
                  },
                  "bloodType": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cập nhật thành công"
          },
          "404": {
            "description": "Không tìm thấy bệnh nhân"
          }
        }
      },
      "delete": {
        "summary": "Xóa hồ sơ bệnh nhân (cascade xóa User + PatientProfile + TreatmentHistory)",
        "tags": ["Patients"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Xóa thành công"
          },
          "404": {
            "description": "Không tìm thấy bệnh nhân"
          }
        }
      }
    }
  }
};

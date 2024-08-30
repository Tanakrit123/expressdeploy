const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const multer = require("multer");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");
const router = express.Router();
const app = express();
const port = 3001;
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/Images/vj");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/Videos/vj");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const bannerstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/Images/banner");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const newsstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/Images/news");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const banstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/Images/banrule");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const filestorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/Document");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const imageStorage = multer({ storage });
const banStorage = multer({ storage: bannerstorage });
const videoUpload = multer({ storage: videoStorage });
const newsUpload = multer({ storage: newsstorage });
const banUpload = multer({ storage: banstorage });
const upload = multer({ storage: filestorage });
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "",
  database: "next",
});
/*const db = mysql.createConnection({
  user: "pplus_next",
  host: "localhost",
  password: "@next@2023",
  database: "pplus_next",
});*/
db.connect();
app.get("/", (req, res) => {
  return res.status(200).json({ status: true, message: "OK" });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  db.query(
    "SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?",
    [username, email],
    (selectErr, selectResult) => {
      if (selectErr) {
        console.error("Error during registration:", selectErr);
        res.status(500).send("Internal Server Error");
      } else {
        const userCount = selectResult[0].count;

        if (userCount > 0) {
          // Username or email already exists
          res.status(400).send("Username or email already exists");
        } else {
          // Insert the new user into the database
          db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, password],
            (insertErr, insertResult) => {
              if (insertErr) {
                console.error("Error during registration:", insertErr);
                res.status(500).send("Internal Server Error");
              } else {
                res.send(insertResult);
              }
            }
          );
        }
      }
    }
  );
});

app.get("/userregister", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.error("Error executing database query:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.get("/banner", (req, res) => {
  db.query("SELECT * FROM banner", (err, result) => {
    if (err) {
      console.error("Error executing database query:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.delete("/deletebanner/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT namebanner FROM banner WHERE id = ?", id, (err, result) => {
    if (err) {
      console.error("Error during banner deletion:", err);
      res.status(500).send("Internal Server Error");
    } else {
      if (result[0].namebanner) {
        const imagePath = path.join(
          __dirname,
          "public",
          "Images",
          "banner",
          result[0].namebanner
        );

        fs.unlink(imagePath, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting image file:", unlinkError);
            res.status(500).send("Internal Server Error");
          } else {
            db.query(
              "DELETE FROM banner WHERE id = ?",
              id,
              (dbError, dbResult) => {
                if (dbError) {
                  console.error(
                    "Error during banner deletion from database:",
                    dbError
                  );
                  res.status(500).send("Internal Server Error");
                } else {
                  res.status(200).json({
                    status: true,
                    message: "Banner deleted successfully",
                  });
                }
              }
            );
          }
        });
      } else {
        res.status(404).json({ status: false, message: "Banner not found" });
      }
    }
  });
});
app.delete("/deleteuser/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM users WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

app.put("/updateuser/:id", (req, res) => {
  const userId = req.params.id;
  const { username, email, password, role } = req.body;
  const values = [username, email, password, role, userId];
  db.query(
    "UPDATE users SET `username`= ?, `email`= ?, `password`= ? , `role`= ? WHERE id = ?",
    values,
    (err, result) => {
      if (err) {
        console.error("Error during user update:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.send(result);
      }
    }
  );
});
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT id, username, role FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, result) => {
      if (err) {
        console.error("Error during login:", err);
        res.status(500).send("Internal Server Error");
      } else {
        if (result.length > 0) {
          res.status(200).send(result);
        } else {
          res.status(401).send("Unauthorized");
        }
      }
    }
  );
});
app.get("/userdetails/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM users WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

let images = null;
app.post("/vjregister/images", imageStorage.array("images"), (req, res) => {
  const filenames = req.files.map((file) => file.filename);
  images = filenames[0];
  console.log("image");
  res.send("Image uploaded successfully");
});
let bannerimages = null;
app.post("/images/banner", banStorage.array("bannerimages"), (req, res) => {
  console.log(req.body);
  const filenames = req.files.map((file) => file.filename);
  console.log(filenames);
  bannerimages = filenames[0];
  db.query(
    "INSERT INTO banner (namebanner) VALUES (?)",
    [bannerimages],
    (err, result) => {
      if (err) {
        console.error("Error during addbanner:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.send(result);
      }
    }
  );
});

let videos = null;
app.post("/vjregister/video", videoUpload.single("video"), (req, res) => {
  try {
    const videoFilename = req.file.filename;
    console.log("video");

    // เก็บชื่อไฟล์วิดีโอไว้ในตัวแปร videos
    videos = videoFilename;

    res.send("Video uploaded successfully");
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});
const lineNotifyToken = "alBO5qw6wZq4cuznyGtalHRqEXbu2jQ77s1dS5rWUHu"; // Replace with your Line Notify token
app.post("/vjregister", async (req, res) => {
  const {
    agencyName,
    bigoId,
    fullName,
    nickname,
    age,
    lineId,
    gender,
    phoneNumber,
    specialSkills,
    province,
    id_users,
  } = req.body;

  try {
    // Insert user into the database
    await db.query(
      "INSERT INTO vjregister (agencyName, bigoId, fullName, nickname, age, lineId, gender, phoneNumber, specialSkills, province, images, video, id_users) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        agencyName,
        bigoId,
        fullName,
        nickname,
        age,
        lineId,
        gender,
        phoneNumber,
        specialSkills,
        province,
        images,
        videos, // นี่คือการใช้ค่าของ videos ที่ถูกเก็บไว้หลังจากอัปโหลดวิดีโอ
        id_users,
      ]
    );

    // Send Line Notify message
    const message = `มี VJ ใหม่ลงทะเบียน\nชื่อ: ${fullName}\nชื่อเอเจนซี่: ${agencyName}\nbigo id: ${bigoId}\nชื่อเล่น: ${nickname}\nอายุ: ${age}\nline id: ${lineId}\nเพศ: ${gender}\nเบอร์โทร: ${phoneNumber}\nความสามารถพิเศษ: ${specialSkills}\nจังหวัด: ${province}`;

    const imagePath = path.join(__dirname, "public", "Images", "vj", images);
    const imageBuffer = fs.readFileSync(imagePath);
    const videoPath = path.join(__dirname, "public", "Videos", "vj", videos); // ใช้ค่าของ videos ที่เก็บไว้
    const videoBuffer = fs.readFileSync(videoPath);
    const form = new FormData();
    form.append("message", message);
    form.append("imageFile", imageBuffer, { filename: images });
    const videoFormData = new FormData();
    videoFormData.append("message", message);
    videoFormData.append("videoFile", videoBuffer, { filename: videos });

    /*form.append("videoFile", videoBuffer, { filename: videos });*/

    await axios.post("https://notify-api.line.me/api/notify", form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${lineNotifyToken}`,
      },
    });

    res.status(200).json({ status: true, message: "Registration successful" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/managevj", (req, res) => {
  db.query("SELECT * FROM vjregister where status = 0", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
// การอัปโหลดไฟล์และบันทึกข้อมูลลงในฐานข้อมูล
app.post("/addban", banUpload.single("banimage"), (req, res) => {
  const filename = req.file.filename;
  // นำข้อมูลเข้าสู่ฐานข้อมูล
  const query = "INSERT INTO ban (namerule) VALUES (?)";
  db.query(query, [filename], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
      console.log(filename);
    } else {
      res.status(200).send("Ban rule added successfully");
    }
  });
});

app.delete("/deleterules/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM ban WHERE id = " + id;
  db.query(query, (dbError, dbResult) => {
    if (dbError) {
      console.error("Error deleting record from database:", dbError);
      return res.status(500).json({
        status: false,
        message: "Internal Server Error",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Record deleted successfully",
    });
  });
});
app.get("/banrules", (req, res) => {
  db.query("SELECT * FROM ban", (err, result) => {
    if (err) {
      console.error("Error executing database query:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.post("/addnews", newsUpload.single("imagesnews"), (req, res) => {
  const { header, story } = req.body;
  const picture = req.file.filename;

  db.query(
    "INSERT INTO news (header, story, picture) VALUES (?, ?, ?)",
    [header, story, picture],
    (err, result) => {
      if (err) {
        console.error("Error during news insertion:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res
          .status(200)
          .json({ status: true, message: "News added successfully" });
      }
    }
  );
});
app.get("/news", (req, res) => {
  db.query("SELECT * FROM news", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.delete("/deletenews/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT picture FROM news WHERE id = ?", id, (err, result) => {
    if (err) {
      console.error("Error during banner deletion:", err);
      res.status(500).send("Internal Server Error");
    } else {
      if (result[0].picture) {
        const imagePath = path.join(
          __dirname,
          "public",
          "Images",
          "news",
          result[0].picture
        );

        fs.unlink(imagePath, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting image file:", unlinkError);
            res.status(500).send("Internal Server Error");
          } else {
            db.query(
              "DELETE FROM news WHERE id = ?",
              id,
              (dbError, dbResult) => {
                if (dbError) {
                  console.error(
                    "Error during banner deletion from database:",
                    dbError
                  );
                  res.status(500).send("Internal Server Error");
                } else {
                  res.status(200).json({
                    status: true,
                    message: "News deleted successfully",
                  });
                }
              }
            );
          }
        });
      } else {
        res.status(404).json({ status: false, message: "News not found" });
      }
    }
  });
});
app.get("/uservj/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM vjregister WHERE id_users = ?", id, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.post("/approvevj/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "UPDATE vjregister SET status = 1 WHERE id = ?",
    id,
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else {
        res.send(result);
      }
    }
  );
});
app.post("/rejectvj/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "UPDATE vjregister SET status = 2 WHERE id = ?",
    id,
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else {
        res.send(result);
      }
    }
  );
});
app.get("/managevjapprove", (req, res) => {
  db.query("SELECT * FROM vjregister where status = 1", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.get("/managevjreject", (req, res) => {
  db.query("SELECT * FROM vjregister where status = 2", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.delete("/deleteVJ/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT images, video FROM vjregister WHERE id = ?",
    id,
    (err, result) => {
      if (err) {
        console.error("Error retrieving VJ details:", err);
        return res.status(500).send("Internal Server Error");
      }
      if (result.length === 0) {
        return res.status(404).json({ status: false, message: "VJ not found" });
      }
      const { images, video } = result[0];
      const imagePath = path.join(__dirname, "public", "Images", "vj", images);
      const videoPath = path.join(__dirname, "public", "Videos", "vj", video);

      if (fs.existsSync(imagePath) && fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(imagePath);
          fs.unlinkSync(videoPath);
          db.query(
            "DELETE FROM vjregister WHERE id = ?",
            id,
            (dbError, dbResult) => {
              if (dbError) {
                console.error(
                  "Error deleting VJ record from database:",
                  dbError
                );
                return res.status(500).send("Internal Server Error");
              }

              return res.status(200).json({
                status: true,
                message: "VJ deleted successfully",
              });
            }
          );
        } catch (unlinkError) {
          console.error("Error deleting files:", unlinkError);
          return res.status(500).send("Internal Server Error");
        }
      } else {
        return res
          .status(404)
          .json({ status: false, message: "One or both files not found" });
      }
    }
  );
});
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    await db.query("DELETE FROM password_reset WHERE user_id = ?", user.id);
    const token = generateNumericOTP(10);
    await savePasswordResetToken(user.id, token);
    sendOTPToEmail(email, token);

    return res
      .status(200)
      .json({ status: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in forgot-password endpoint:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
});
app.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  try {
    db.query(
      "SELECT * FROM password_reset WHERE token  = ?",
      [otp], // นี้ควรเป็น array ที่มีค่า otp เป็นสมาชิก
      (err, result) => {
        if (err) {
          console.error("Error in database query:", err);
          return res
            .status(500)
            .json({ status: false, message: "Internal Server Error" });
        }

        if (result.length > 0) {
          return res
            .status(200)
            .json({ status: true, message: "OTP is valid" });
        } else {
          // ไม่พบข้อมูลหรือ OTP ไม่ถูกต้อง
          return res
            .status(400)
            .json({ status: false, message: "Invalid OTP" });
        }
      }
    );
  } catch (error) {
    console.error("Error in verify-otp endpoint:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
});
app.post("/updatepassword", (req, res) => {
  const { password, otp } = req.body;

  db.query(
    "UPDATE users SET password = ? WHERE id IN (SELECT user_id FROM password_reset WHERE token = ?)",

    [password, otp],
    (err, result) => {
      if (err) {
        console.error("Error during news insertion:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res
          .status(200)
          .json({ status: true, message: "News added successfully" });
      }
    }
  );
});
function sendOTPToEmail(email, generatedToken) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nexttimeagency@gmail.com",
      pass: "rgztmvlvsbdptogi",
    },
  });

  // กำหนดรายละเอียดข้อความ
  const mailOptions = {
    from: "6511850009@gmail.com",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is: ${generatedToken}`,
  };

  // ส่งอีเมล
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

// ฟังก์ชันตรวจสอบ email ในฐานข้อมูล
async function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE email = ?", email, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
}

async function savePasswordResetToken(userId, token) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO password_reset (user_id, token) VALUES (?, ?)",
      [userId, token],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

function generateNumericOTP(length) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}
app.post("/updatepassword", (req, res) => {
  const { password, otp } = req.body;

  db.query(
    "UPDATE users SET password = ? WHERE id IN (SELECT user_id FROM password_reset WHERE token = ?)",

    [password, otp],
    (err, result) => {
      if (err) {
        console.error("Error during news insertion:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res
          .status(200)
          .json({ status: true, message: "News added successfully" });
      }
    }
  );
});

app.put("/editrules/:id", (req, res) => {
  const id = req.params.id;
  const { rules } = req.body;

  const query = "UPDATE banrules SET rules = ? WHERE id = ?";
  db.query(query, [rules, id], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).send("Rule updated successfully");
    }
  });
});
app.post("/adddocument", upload.single("filedocument"), (req, res, next) => {
  const Filename = req.file.filename;
  document = Filename;
  const { filename } = req.body;

  // เพิ่มข้อมูลลงในฐานข้อมูล
  const sql = `INSERT INTO document (filename, section) VALUES (?, ?)`;
  db.query(sql, [document, filename], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).send("Error inserting data");
    } else {
      console.log("Data inserted successfully");
      res.status(200).send("Data inserted successfully");
    }
  });
});
app.get("/doc", (req, res) => {
  db.query("SELECT * FROM document", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "public", "document", filename); // ตั้งค่าเส้นทางไฟล์ของคุณให้ถูกต้อง

  // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(err);
      return res.status(404).end("File not found");
    }

    // ส่งไฟล์กลับให้ผู้ใช้งาน
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(err);
        res.status(500).end("Internal Server Error");
      }
    });
  });
});
app.delete("/deletedoc/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT filename FROM document WHERE ID = ?", id, (err, result) => {
    if (err) {
      console.error("Error during banner deletion:", err);
      res.status(500).send("Internal Server Error");
    } else {
      if (result[0].filename) {
        const docPath = path.join(
          __dirname,
          "public",
          "Document",
          result[0].filename
        );

        fs.unlink(docPath, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting image file:", unlinkError);
            res.status(500).send("Internal Server Error");
          } else {
            db.query(
              "DELETE FROM document WHERE id = ?",
              id,
              (dbError, dbResult) => {
                if (dbError) {
                  console.error(
                    "Error during banner deletion from database:",
                    dbError
                  );
                  res.status(500).send("Internal Server Error");
                } else {
                  res.status(200).json({
                    status: true,
                    message: "Banner deleted successfully",
                  });
                }
              }
            );
          }
        });
      } else {
        res.status(404).json({ status: false, message: "Banner not found" });
      }
    }
  });
});
app.get("/countvj", (req, res) => {
  // นับจำนวน vj ทั้งหมด
  db.query("SELECT COUNT(*) AS total FROM vjregister", (err, results) => {
    if (err) {
      console.error("Error counting total:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    const total = results[0].total;

    // นับจำนวน vj ที่เข้าระบบ
    db.query(
      "SELECT COUNT(*) AS loggedIn FROM vjregister WHERE status = 1",
      (err, results) => {
        if (err) {
          console.error("Error counting loggedIn:", err);
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
        const loggedIn = results[0].loggedIn;

        // นับจำนวน vj ที่สมัคร
        db.query(
          "SELECT COUNT(*) AS registered FROM vjregister WHERE status = 0",
          (err, results) => {
            if (err) {
              console.error("Error counting registered:", err);
              res.status(500).json({ error: "Internal Server Error" });
              return;
            }
            const registered = results[0].registered;

            db.query(
              "SELECT COUNT(*) AS countchat FROM chat WHERE status = 0",
              (err, results) => {
                if (err) {
                  console.error("Error counting registered:", err);
                  res.status(500).json({ error: "Internal Server Error" });
                  return;
                }
                const chat = results[0].countchat;

                // ส่งข้อมูลทั้งหมดกลับไปให้กับ client
                res.json({ total, loggedIn, registered, chat });
              }
            );
          }
        );
      }
    );
  });
});
app.post("/chat", (req, res) => {
  const { contact, contactback } = req.body;
  // Check if username or email already exists in the database
  db.query(
    "INSERT INTO chat (story, chatt) VALUES (?, ?)",
    [contact, contactback],
    (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error during chat insertion:", insertErr);
        res.status(500).send("Internal Server Error");
      } else {
        res.send(insertResult);
      }
    }
  );
});
app.get("/chatdsee", (req, res) => {
  db.query("SELECT * FROM chat where status = 0", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.delete("/deletechat/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM chat WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.put("/updatechat/:id", (req, res) => {
  const id = req.params.id;

  const query = "UPDATE chat SET status = 1 WHERE id = ?";
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).send("Rule updated successfully");
    }
  });
});
app.get("/chatsee", (req, res) => {
  db.query("SELECT * FROM chat where status = 1", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

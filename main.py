import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pathlib import Path
import logging
from contextlib import asynccontextmanager

# FastAPI and related imports
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

# Database imports
import asyncpg
from asyncpg import Pool

# HTTP client imports
import httpx
import aiofiles

# Email imports
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Excel handling
import pandas as pd
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows

# File conversion and processing
import subprocess
import tempfile
import shutil

# Scheduling
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = "postgresql://retool:4zBLlh1TPsAu@ep-frosty-pine-a6aqfk20.us-west-2.retooldb.com/retool"

# API Configuration
IMOCHA_API_KEY = "JHuaeAvDQsGfJxlHYpeJwFOxySVrdm"
IMOCHA_BASE_URL = "https://apiv3.imocha.io/v3"

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "sapireddyvamsi@gmail.com"
SMTP_PASSWORD = "urvuwnnnmdjwohxp"

# Global variables
db_pool: Optional[Pool] = None
scheduler: Optional[AsyncIOScheduler] = None

# Test IDs configuration
TEST_IDS = {
    "cloudEC": ["1292779", "1292781", "1295883", "1292990", "1292769", "1292775", "1292733", "1292976", "1292950", "1292733", "1292976", "1292765"],
    "dataEC": ["1303946", "1293813", "1293971", "1263132", "1304065", "1233151", "1294495", "1302835", "1294495", "1304066", "1304100", "1292173", "1293822", "1303985", "1303999", "1304109", "1304111", "1304149"],
    "appEC": ["1304441", "1228695", "1302022", "1228712"]
}

# Pydantic models
class CandidateInfo(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    prescreening_status: str
    role: str
    recruitment_phase: str
    resume_score: Optional[str] = None
    resume: Optional[str] = None
    candidate_phone: Optional[str] = None
    hr_email: Optional[EmailStr] = None
    rrf_id: Optional[str] = None
    eng_center: Optional[str] = None
    content: Optional[str] = None

class InviteCandidate(BaseModel):
    inviteId: str
    email: EmailStr
    name: str
    sendEmail: bool = True
    callbackURL: Optional[str] = None
    redirectURL: Optional[str] = None
    disableMandatoryFields: bool = False
    hideInstruction: bool = False

class RRFUpdate(BaseModel):
    rrf_id: str
    role: str
    eng_center: str
    rrf_status: str

class EmailData(BaseModel):
    recipient: EmailStr
    data: Dict[str, Any]

class FeedbackForm(BaseModel):
    rrf_id: str
    position: str
    candidate_name: str
    interview_date: str
    interviewer_name: str
    hr_email: EmailStr
    candidate_email: EmailStr
    core_cloud_concepts_deployment: Optional[str] = None
    core_cloud_concepts_configuration: Optional[str] = None
    core_cloud_concepts_troubleshooting: Optional[str] = None
    core_cloud_concepts_justification: Optional[str] = None
    core_cloud_concepts_improvements: Optional[str] = None
    networking_security_deployment: Optional[str] = None
    networking_security_configuration: Optional[str] = None
    networking_security_troubleshooting: Optional[str] = None
    networking_security_justification: Optional[str] = None
    networking_security_improvements: Optional[str] = None
    infrastructure_management_deployment: Optional[str] = None
    infrastructure_management_configuration: Optional[str] = None
    infrastructure_management_troubleshooting: Optional[str] = None
    infrastructure_management_justification: Optional[str] = None
    infrastructure_management_improvements: Optional[str] = None
    scalability_high_avail_deployment: Optional[str] = None
    scalability_high_avail_configuration: Optional[str] = None
    scalability_high_avail_troubleshooting: Optional[str] = None
    scalability_high_avail_justification: Optional[str] = None
    scalability_high_avail_improvements: Optional[str] = None
    automation_deployment: Optional[str] = None
    automation_configuration: Optional[str] = None
    automation_troubleshooting: Optional[str] = None
    automation_justification: Optional[str] = None
    automation_improvements: Optional[str] = None
    observability_deployment: Optional[str] = None
    observability_configuration: Optional[str] = None
    observability_troubleshooting: Optional[str] = None
    observability_justification: Optional[str] = None
    observability_improvements: Optional[str] = None
    detailed_feedback: Optional[str] = None
    result: Optional[str] = None

class UpdateStatus(BaseModel):
    email: EmailStr
    status: str
    panel: str
    dateTime: str
    meetingLink: Optional[str] = None

class LoginUser(BaseModel):
    email: EmailStr
    name: str
    date: str
    time: str

class LogoutUser(BaseModel):
    id: int

class AdminUser(BaseModel):
    vamid: str
    name: str
    email: EmailStr
    ec_mapping: str
    status: str

class VisibilityUpdate(BaseModel):
    filterType: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class RoundSave(BaseModel):
    rounds: List[Dict[str, str]]

# Database functions
async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(
            DATABASE_URL,
            ssl='require',
            min_size=1,
            max_size=10,
            command_timeout=60
        )
    return db_pool

async def close_db_pool():
    global db_pool
    if db_pool:
        await db_pool.close()
        db_pool = None

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await get_db_pool()
    await setup_scheduler()
    await add_visibility_columns()
    yield
    # Shutdown
    if scheduler:
        scheduler.shutdown()
    await close_db_pool()

# Create FastAPI app
app = FastAPI(
    title="TAG AI Recruitment API",
    description="Complete recruitment management system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Static files
app.mount("/static", StaticFiles(directory="public"), name="static")

# Root endpoint
@app.get("/")
async def root():
    return FileResponse("public/index.html")

# GitHub token endpoint
@app.get("/api/github-token")
async def get_github_token():
    github_token = os.getenv("GITHUB_TOKEN")
    return {"token": github_token}

# Admin check endpoint
@app.post("/api/check-admin")
async def check_admin(request: Dict[str, str]):
    email = request.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchrow(
            "SELECT ec_mapping, status FROM admin_table WHERE email ILIKE $1",
            email
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="User not available")
        
        if result['status'] != "Enable":
            raise HTTPException(status_code=403, detail="Account is disabled. Please contact admin.")
        
        return {"ec_mapping": result['ec_mapping']}

# Invite candidate endpoint
@app.post("/api/invite-candidate")
async def invite_candidate(request: InviteCandidate):
    if not request.inviteId:
        raise HTTPException(status_code=400, detail="Missing inviteId in the request.")
    
    target_url = f"{IMOCHA_BASE_URL}/tests/{request.inviteId}/invite"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                target_url,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": IMOCHA_API_KEY
                },
                json={
                    "email": request.email,
                    "name": request.name,
                    "sendEmail": request.sendEmail,
                    "callbackURL": request.callbackURL,
                    "redirectURL": request.redirectURL,
                    "disableMandatoryFields": request.disableMandatoryFields,
                    "hideInstruction": request.hideInstruction
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Error response from iMocha: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to send invite to iMocha")
            
            return response.json()
            
        except httpx.RequestError as e:
            logger.error(f"Error inviting candidate: {e}")
            raise HTTPException(status_code=500, detail="An error occurred while sending the invite")

# RRF update endpoint
@app.post("/api/rrf-update")
async def rrf_update(request: RRFUpdate):
    if not all([request.rrf_id, request.role, request.eng_center, request.rrf_status]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Check if record exists
        result = await conn.fetchrow(
            "SELECT * FROM rrf_details WHERE rrf_id = $1",
            request.rrf_id
        )
        
        if not result:
            # Insert new record
            await conn.execute(
                """
                INSERT INTO rrf_details (rrf_id, role, eng_center, resume_count, rrf_status, rrf_startdate)
                VALUES ($1, $2, $3, 1, $4, CURRENT_TIMESTAMP)
                """,
                request.rrf_id, request.role, request.eng_center, request.rrf_status
            )
            return {"message": "RRF submitted successfully!"}
        else:
            # Update existing record
            await conn.execute(
                """
                UPDATE rrf_details
                SET resume_count = resume_count + 1, rrf_status = $1
                WHERE rrf_id = $2
                """,
                request.rrf_status, request.rrf_id
            )
            return {"message": "RRF updated successfully!"}

# Add candidate info endpoint
@app.post("/api/add-candidate-info")
async def add_candidate_info(request: CandidateInfo):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            result = await conn.fetchrow(
                """
                INSERT INTO candidate_info (candidate_name, candidate_email, prescreening_status, role, recruitment_phase, resume_score, resume, candidate_phone, hr_email, rrf_id, eng_center, content)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
                """,
                request.candidate_name, request.candidate_email, request.prescreening_status,
                request.role, request.recruitment_phase, request.resume_score, request.resume,
                request.candidate_phone, request.hr_email, request.rrf_id, request.eng_center,
                request.content
            )
            
            return {
                "success": True,
                "message": "Candidate info saved",
                "data": dict(result)
            }
            
        except asyncpg.UniqueViolationError:
            return {
                "success": False,
                "message": "Duplicate candidate email",
                "code": "23505"
            }
        except Exception as e:
            logger.error(f"Error saving candidate information: {e}")
            return {
                "success": False,
                "message": "Error saving candidate info",
                "error": str(e)
            }

# Get candidate info endpoint
@app.get("/api/get/candidate-info")
async def get_candidate_info():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            rows = await conn.fetch(
                """
                SELECT id, candidate_name, resume, content, prescreening_status, hr_email, rrf_id, eng_center, role
                FROM candidate_info
                ORDER BY id DESC
                """
            )
            
            if not rows:
                return {
                    "success": False,
                    "message": "No candidate evaluations found",
                    "data": []
                }
            
            return {
                "success": True,
                "data": [dict(row) for row in rows]
            }
            
        except Exception as e:
            logger.error(f"Error fetching candidate info: {e}")
            return {
                "success": False,
                "message": "Server error while fetching candidate data",
                "error": str(e),
                "data": []
            }

# Get candidate evaluation by ID
@app.get("/api/get/candidate-evaluation/{candidate_id}")
async def get_candidate_evaluation(candidate_id: int):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            result = await conn.fetchrow(
                """
                SELECT content, candidate_name, candidate_email, candidate_phone, prescreening_status, 
                       resume_score, resume as resume_url, hr_email, rrf_id, eng_center, role
                FROM candidate_info
                WHERE id = $1
                """,
                candidate_id
            )
            
            if not result:
                return {
                    "success": False,
                    "message": "Candidate evaluation not found"
                }
            
            return {
                "success": True,
                "data": dict(result)
            }
            
        except Exception as e:
            logger.error(f"Error fetching candidate evaluation: {e}")
            return {
                "success": False,
                "message": "Server error while fetching evaluation",
                "error": str(e)
            }

# Email sending functionality
async def send_email(recipient: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = recipient
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USERNAME, recipient, text)
        server.quit()
        
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False

# Send email endpoint
@app.post("/api/send-email")
async def send_email_endpoint(request: EmailData):
    candidate_email = request.data.get("candidateEmail")
    score = request.data.get("score")
    performance_category = request.data.get("performanceCategory")
    test_name = request.data.get("testName")
    pdf_report_url = request.data.get("pdfReportUrl")
    
    feedback_form_url = f"http://localhost:3000/assessment-form-html.html?email={candidate_email}&score={score}&performanceCategory={performance_category}"
    
    subject = f"Test Results: {test_name}"
    body = f"""Hello,

Here are the test results for {test_name}:

- Candidate Email: {candidate_email}
- Score: {score}
- Performance Category: {performance_category}

You can download the report here: {pdf_report_url}

For further actions, please access the feedback form using the following link:
{feedback_form_url}

Best regards,
Your Team"""
    
    success = await send_email(request.recipient, subject, body)
    
    if success:
        return {"message": "Email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")

# Save iMocha results endpoint
@app.post("/api/save-imocha-results")
async def save_imocha_results(request: Dict[str, List[Dict]]):
    reports = request.get("reports", [])
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            for report in reports:
                candidate_email = report.get("candidateEmail")
                score = report.get("score")
                total_test_points = report.get("totalTestPoints")
                score_percentage = report.get("scorePercentage")
                performance_category = report.get("performanceCategory")
                test_name = report.get("testName")
                pdf_report_url = report.get("pdfReportUrl")
                
                # Check if record exists
                existing = await conn.fetchrow(
                    "SELECT * FROM imocha_results WHERE candidate_email = $1",
                    candidate_email
                )
                
                if not existing:
                    await conn.execute(
                        """
                        INSERT INTO imocha_results (candidate_email, score, total_test_points, score_percentage, performance_category, test_name, pdf_report_url)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        """,
                        candidate_email, score, total_test_points, score_percentage, performance_category, test_name, pdf_report_url
                    )
                else:
                    logger.info(f"Record for {candidate_email} already exists")
            
            return {"message": "Results saved successfully"}
            
        except Exception as e:
            logger.error(f"Error saving results: {e}")
            raise HTTPException(status_code=500, detail="Server error")

# Helper functions for iMocha integration
async def fetch_with_retry(client: httpx.AsyncClient, request_func, retries: int = 3, delay: int = 1000):
    for i in range(retries):
        try:
            return await request_func()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning(f"Rate limit hit. Retrying in {delay}ms...")
                await asyncio.sleep(delay / 1000)
                delay *= 2
            else:
                raise e
    raise Exception("Max retries exceeded")

async def get_completed_test_attempts(test_ids: List[str], start_date: str, end_date: str):
    all_test_attempts = []
    
    async with httpx.AsyncClient() as client:
        for test_id in test_ids:
            try:
                async def make_request():
                    response = await client.post(
                        f"{IMOCHA_BASE_URL}/candidates/testattempts?state=completed",
                        headers={
                            "x-api-key": IMOCHA_API_KEY,
                            "Content-Type": "application/json"
                        },
                        json={
                            "testId": test_id,
                            "StartDateTime": start_date,
                            "EndDateTime": end_date
                        }
                    )
                    response.raise_for_status()
                    return response.json()
                
                response_data = await fetch_with_retry(client, make_request)
                
                if response_data.get("result", {}).get("testAttempts"):
                    all_test_attempts.extend(response_data["result"]["testAttempts"])
                    logger.info(f"Fetched test attempts for Test ID: {test_id}")
                    
            except Exception as e:
                logger.error(f"Failed to fetch test attempts for Test ID {test_id}: {e}")
    
    return all_test_attempts

async def get_report(invitation_id: str):
    async with httpx.AsyncClient() as client:
        try:
            async def make_request():
                response = await client.get(
                    f"{IMOCHA_BASE_URL}/reports/{invitation_id}",
                    headers={
                        "x-api-key": IMOCHA_API_KEY,
                        "Content-Type": "application/json"
                    }
                )
                response.raise_for_status()
                return response.json()
            
            return await fetch_with_retry(client, make_request)
            
        except Exception as e:
            logger.error(f"Error fetching report for invitation ID {invitation_id}: {e}")
            return None

async def fetch_and_save_test_results(test_ids: List[str], start_date: str, end_date: str):
    logger.info("Fetching test results...")
    
    try:
        test_attempts = await get_completed_test_attempts(test_ids, start_date, end_date)
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            for attempt in test_attempts:
                report = await get_report(attempt.get("testInvitationId"))
                
                if report:
                    await conn.execute(
                        """
                        INSERT INTO imocha_results 
                        (candidate_email, score, total_test_points, score_percentage, performance_category, test_name, pdf_report_url, attempted_date)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (candidate_email) 
                        DO UPDATE SET 
                            score = EXCLUDED.score,
                            total_test_points = EXCLUDED.total_test_points,
                            score_percentage = EXCLUDED.score_percentage,
                            performance_category = EXCLUDED.performance_category,
                            test_name = EXCLUDED.test_name,
                            attempted_date = EXCLUDED.attempted_date,
                            pdf_report_url = EXCLUDED.pdf_report_url
                        """,
                        report.get("candidateEmail"),
                        report.get("score"),
                        report.get("totalTestPoints"),
                        report.get("scorePercentage"),
                        report.get("performanceCategory"),
                        report.get("testName"),
                        report.get("pdfReportUrl"),
                        report.get("attemptedOn")
                    )
                    logger.info(f"Saved/Updated: {report.get('candidateEmail')}")
        
        logger.info("Test results updated successfully.")
        
    except Exception as e:
        logger.error(f"Error saving test results: {e}")

# Test attempt endpoints
@app.post("/api/callTestAttempts/cloudEC")
async def call_test_attempts_cloud_ec(request: Dict[str, str]):
    start_date = request.get("startDate")
    end_date = request.get("endDate")
    
    start_datetime = f"{start_date}T00:00:00Z"
    end_datetime = f"{end_date}T23:59:59Z"
    
    await fetch_and_save_test_results(TEST_IDS["cloudEC"], start_datetime, end_datetime)
    return {"message": "Cloud EC test attempts processed"}

@app.post("/api/callTestAttempts/dataEC")
async def call_test_attempts_data_ec(request: Dict[str, str]):
    start_date = request.get("startDate")
    end_date = request.get("endDate")
    
    start_datetime = f"{start_date}T00:00:00Z"
    end_datetime = f"{end_date}T23:59:59Z"
    
    await fetch_and_save_test_results(TEST_IDS["dataEC"], start_datetime, end_datetime)
    return {"message": "Data EC test attempts processed"}

@app.post("/api/callTestAttempts/appEC")
async def call_test_attempts_app_ec(request: Dict[str, str]):
    start_date = request.get("startDate")
    end_date = request.get("endDate")
    
    start_datetime = f"{start_date}T00:00:00Z"
    end_datetime = f"{end_date}T23:59:59Z"
    
    await fetch_and_save_test_results(TEST_IDS["appEC"], start_datetime, end_datetime)
    return {"message": "App EC test attempts processed"}

# Scheduler setup
async def setup_scheduler():
    global scheduler
    scheduler = AsyncIOScheduler()
    
    # Schedule the task to run every 10 seconds (equivalent to the Node.js 10000ms interval)
    async def scheduled_task():
        logger.info("Scheduled task running...")
        now = datetime.now()
        last_24_hours = (now - timedelta(hours=24)).isoformat()
        current_time = now.isoformat()
        
        # Run only appEC as in the original code
        await fetch_and_save_test_results(TEST_IDS["appEC"], last_24_hours, current_time)
    
    scheduler.add_job(
        scheduled_task,
        trigger=IntervalTrigger(seconds=10),
        id='fetch_test_results',
        replace_existing=True
    )
    
    scheduler.start()

# Utility function to add visibility columns
async def add_visibility_columns():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            await conn.execute(
                "ALTER TABLE candidate_info ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE"
            )
            await conn.execute(
                "ALTER TABLE rrf_details ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE"
            )
            await conn.execute(
                "ALTER TABLE imocha_results ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE"
            )
            logger.info("Visibility columns added successfully in all tables.")
        except Exception as e:
            logger.error(f"Error adding visibility columns: {e}")

# Count endpoints
@app.get("/api/devops-resume-count")
async def get_devops_resume_count():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            result = await conn.fetchrow(
                """
                SELECT COUNT(*) AS count
                FROM candidate_info
                WHERE role IN ('Junior Azure DevOps Engineer', 'Lead Azure DevOps Engineer','Senior Azure DevOps Engineer','Junior AWS DevOps Engineer','Senior AWS Cloudops Engineer','Lead AWS DevOps Engineer')
                AND visible = TRUE
                """
            )
            return {"count": result['count']}
        except Exception as e:
            logger.error(f"Error fetching DevOps resume count: {e}")
            raise HTTPException(status_code=500, detail="An error occurred while fetching the DevOps resume count")

# Continue with all other endpoints...
# Due to length constraints, I'll create separate files for the remaining endpoints

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
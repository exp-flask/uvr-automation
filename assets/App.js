import React, {useCallback, useState, useEffect} from 'react'
import {useDropzone} from 'react-dropzone'
import loadingGif from './images/loading.gif'

const App = () => {
    const defaultChecklist = {
        rgnAllFileUploaded: false,
        ogmFileUploaded: false,
        userRoleFileUploaded: false,
        podFileUploaded: false,
        ttaFileUploaded: false,
        danyaUserFileUploaded: false,
        lewinFileUploaded: false,
        monitoringFileUploaded: false,
        rgn1FileUploaded: false,
        rgn2FileUploaded: false,
        rgn3FileUploaded: false,
        rgn4FileUploaded: false,
        rgn5FileUploaded: false,
        rgn6FileUploaded: false,
        rgn7FileUploaded: false,
        rgn8FileUploaded: false,
        rgn9FileUploaded: false,
        rgn10FileUploaded: false,
        rgn11FileUploaded: false,
        rgn12FileUploaded: false
    };
    const [checklist, setChecklist] = useState(defaultChecklist)
    const [isLoading, setIsLoading] = useState(false);
    const [uploadCount, setUploadCount] = useState(null);
    const [status, setStatus] = useState('Waiting for file upload. Upload files in the dropzone above.');
    const [downloadReady, setDownloadReady] = useState(false);
    const [month, setMonth] = useState(getNextMonth());
    const [year, setYear] = useState(getYear());
    const monthOptions = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];
    const yearOptions = [getYear() - 1, getYear(), getYear() + 1];
    const csrftoken = getCookie('csrftoken');

    const onDrop = useCallback(acceptedFiles => {
        setIsLoading(true);
        setDownloadReady(false);
        setChecklist(defaultChecklist);
        setUploadCount(null);
        setStatus(
            <span className="text-blue-700">
                Processing files... (this may take up to 2 minutes)
            </span>
        );
        let formData = new FormData();
        acceptedFiles.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
        formData.append('month', month);
        formData.append('year', year);
        fetch('/user_verification/run_reports', {
            method: 'POST',
            body: formData,
            headers: { "X-CSRFToken": csrftoken }
        })
        .then(response => response.json())
        .then(response => {
            setChecklist(response);
            setUploadCount(Object.values(response).filter(fileUploaded => fileUploaded).length);
            let everyFileUploaded = Object.values(response).every(fileUploaded => fileUploaded);
            setDownloadReady(everyFileUploaded);
            if (everyFileUploaded) {
                setStatus(
                    <span className="text-green-600">
                        All reports were processed successfully. Download the files below.
                    </span>
                );
            } else {
                setStatus(
                    <span className="text-red-600">
                        Insufficient files provided. Refer to the checklist below to see what files are missing.
                    </span>
                );
            }
            setIsLoading(false);
        })
        .catch(error => {
            console.log(error);
            setStatus(
                <span className="text-red-600">
                    There was an error. Wait a moment and try again or if the problem persists report the error.
                </span>
            );
            setIsLoading(false);
        });
      }, [month, year]);
    const {getRootProps, getInputProps} = useDropzone({onDrop});

    const getDownloadStatus = (month, year) => {
        setDownloadReady(false);
        fetch(`/user_verification/get_download_status/${year}/${month}`, {method: 'GET'})
            .then(response => response.json())
            .then(response => {
                if (response.download_available) {
                    setDownloadReady(true);
                    setStatus(
                        <span className="text-green-600">
                            {month} {year} reports are available. Download below or rerun reports.
                        </span>
                    );
                } else {
                    setStatus('Waiting for file upload. Upload files in the dropzone above.');
                }
            })
    }
    useEffect(()=>{
        getDownloadStatus(month, year);
    }, [])

    return (
        <div className="m-5 font-sans">
            <h1 className="text-3xl font-normal">User Verification Automation</h1>

            <h2 className="text-2xl font-normal mb-3">Run User Verification Reports (UVR)</h2>
            <ul className="list-disc list-inside leading-relaxed mt-0">
                <li>Upload all 20 required UVR files to run reports ({uploadCount === null ? '-' : uploadCount}/{Object.keys(checklist).length} uploaded)</li>
                <li>If you are unsure of which files to upload, refer to the checklist at the bottom of the page</li>
            </ul>
            {isLoading ?
                <div className="border-dashed border-3 max-w-4xl h-60 rounded justify-center items-center border-gray-400 flex flex-col" style={{backgroundColor: '#ECF0F1'}}>
                    <img src={loadingGif} alt="loading" className="max-w-4xl h-60" />
                </div>
                :
                <div className="border-dashed border-3 max-w-4xl h-60 rounded justify-center items-center border-gray-400 bg-gray-50 cursor-pointer flex flex-col" {...getRootProps()}>
                    <input {...getInputProps()} />
                    <div className="mb-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="block h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <div className="text-gray-500 text-lg ml-2">Choose files or drag here</div>
                </div>
            }

            <div className="my-5">
                <label htmlFor="month" className="font-bold">Month: </label>
                <select 
                    id="month" 
                    name="month" 
                    value={month} onChange={e => {
                        let selectedMonth = e.target.value;
                        setMonth(selectedMonth);
                        setChecklist(defaultChecklist);
                        setUploadCount(null);
                        getDownloadStatus(selectedMonth, year);
                    }}
                >
                    {monthOptions.map((m, i) => 
                        <option 
                            key={i} 
                            value={new Date(`${m} 1, 1970`).toLocaleString('default', {month: 'short'})}
                        >
                            {m}
                        </option>
                    )}
                </select>
                <label htmlFor="year" className="font-bold ml-2"> Year: </label>
                <select 
                    id="year" 
                    name="year" 
                    value={year} onChange={e => {
                        let selectedYear = e.target.value;
                        setYear(selectedYear);
                        setChecklist(defaultChecklist);
                        setUploadCount(null);
                        getDownloadStatus(month, selectedYear);
                    }}
                >
                    {yearOptions.map((y, i) => <option key={i} value={y}>{y}</option>)}
                </select>
            </div>

            <p className="text-xl">
                <span className="font-bold">Status: </span>
                {status}
            </p>

            {downloadReady ? 
                <a href={`/user_verification/get_processed_files/${year}/${month}`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded no-underline">
                    <span>Download Processed Reports</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="-2 -4 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </a>
                :
                <a className="bg-gray-300 opacity-30 font-bold py-2 px-4 rounded no-underline cursor-not-allowed">
                    <span>Download Processed Reports</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="-2 -4 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </a>
            }
            
            <h2 className="text-2xl font-normal mb-3">
                UVR Files Checklist:
                {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg> */}
            </h2>
            <div className="ml-3 leading-snug">
                <label className="flex items-center" htmlFor="UVR1">
                    <input type="checkbox" name="UVR1" id="UVR1" readOnly className="h-4 w-4" checked={checklist.rgnAllFileUploaded} />
                    <span className="ml-2">RgnAll HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR2">
                    <input type="checkbox" name="UVR2" id="UVR2" readOnly className="h-4 w-4" checked={checklist.ogmFileUploaded} />
                    <span className="ml-2">Rgn0 OGM Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR3">
                    <input type="checkbox" name="UVR3" id="UVR3" readOnly className="h-4 w-4" checked={checklist.userRoleFileUploaded} />
                    <span className="ml-2">UserRoleListingReport.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR4">
                    <input type="checkbox" name="UVR4" id="UVR4" readOnly className="h-4 w-4" checked={checklist.podFileUploaded} />
                    <span className="ml-2">Rgn0 HSES POD Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR5">
                    <input type="checkbox" name="UVR5" id="UVR5" readOnly className="h-4 w-4" checked={checklist.ttaFileUploaded} />
                    <span className="ml-2">Rgn0 HSES T&TA Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR6">
                    <input type="checkbox" name="UVR6" id="UVR6" readOnly className="h-4 w-4" checked={checklist.danyaUserFileUploaded} />
                    <span className="ml-2">Danya User HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR7">
                    <input type="checkbox" name="UVR7" id="UVR7" readOnly className="h-4 w-4" checked={checklist.lewinFileUploaded} />
                    <span className="ml-2">Lewin Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR8">
                    <input type="checkbox" name="UVR8" id="UVR8" readOnly className="h-4 w-4" checked={checklist.monitoringFileUploaded} />
                    <span className="ml-2">Monitoring_Network_Users.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR9">
                    <input type="checkbox" name="UVR9" id="UVR9" readOnly className="h-4 w-4" checked={checklist.rgn1FileUploaded} />
                    <span className="ml-2">Rgn01 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR10">
                    <input type="checkbox" name="UVR10" id="UVR10" readOnly className="h-4 w-4" checked={checklist.rgn2FileUploaded} />
                    <span className="ml-2">Rgn02 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR11">
                    <input type="checkbox" name="UVR11" id="UVR11" readOnly className="h-4 w-4" checked={checklist.rgn3FileUploaded} />
                    <span className="ml-2">Rgn03 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR12">
                    <input type="checkbox" name="UVR12" id="UVR12" readOnly className="h-4 w-4" checked={checklist.rgn4FileUploaded} />
                    <span className="ml-2">Rgn04 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR13">
                    <input type="checkbox" name="UVR13" id="UVR13" readOnly className="h-4 w-4" checked={checklist.rgn5FileUploaded} />
                    <span className="ml-2">Rgn05 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR14">
                    <input type="checkbox" name="UVR14" id="UVR14" readOnly className="h-4 w-4" checked={checklist.rgn6FileUploaded} />
                    <span className="ml-2">Rgn06 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR15">
                    <input type="checkbox" name="UVR15" id="UVR15" readOnly className="h-4 w-4" checked={checklist.rgn7FileUploaded} />
                    <span className="ml-2">Rgn07 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR16">
                    <input type="checkbox" name="UVR16" id="UVR16" readOnly className="h-4 w-4" checked={checklist.rgn8FileUploaded} />
                    <span className="ml-2">Rgn08 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR17">
                    <input type="checkbox" name="UVR17" id="UVR17" readOnly className="h-4 w-4" checked={checklist.rgn9FileUploaded} />
                    <span className="ml-2">Rgn09 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR18">
                    <input type="checkbox" name="UVR18" id="UVR18" readOnly className="h-4 w-4" checked={checklist.rgn10FileUploaded} />
                    <span className="ml-2">Rgn10 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR19">
                    <input type="checkbox" name="UVR19" id="UVR19" readOnly className="h-4 w-4" checked={checklist.rgn11FileUploaded} />
                    <span className="ml-2">Rgn11 HSES Accounts.xlsx</span>
                </label>
                <label className="flex items-center" htmlFor="UVR20">
                    <input type="checkbox" name="UVR20" id="UVR20" readOnly className="h-4 w-4" checked={checklist.rgn12FileUploaded} />
                    <span className="ml-2">Rgn12 HSES Accounts.xlsx</span>
                </label>
            </div>
        </div>
    );
};

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getNextMonth() {
    const now = new Date();
    if (now.getMonth() === 11)
        return new Date(now.getFullYear() + 1, 0, 1).toLocaleString('default', { month: 'short' });
    else
        return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleString('default', { month: 'short' });
}

function getYear() {
    const now = new Date();
    if (now.getMonth() === 11)
        return now.getFullYear() + 1;
    else
        return now.getFullYear();
}

export default App;
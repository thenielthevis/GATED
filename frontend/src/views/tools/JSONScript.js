import React, { useState } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CTabs,
  CTabContent,
  CTabPanel,
  CTabList,
  CTab,
  CCallout,
} from '@coreui/react';
import Swal from 'sweetalert2';
import CIcon from '@coreui/icons-react';
import { cilCheckCircle, cilLoopCircular, cilWarning } from '@coreui/icons';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const JSONScript = () => {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/json") {
      setFile(selectedFile);
    } else {
      alert("Please select a JSON file.");
      setFile(null);
      event.target.value = ""; // Clear the file input
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      Swal.fire({
        icon: 'error',
        title: 'No File Selected',
        text: 'Please select a file first.',
      });
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      // Show loading spinner while the file is being uploaded
      Swal.fire({
        title: 'Uploading File...',
        text: 'Please wait while your file is being uploaded.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
  
      const response = await fetch("http://localhost:8000/json/upload-json-file", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });
  
      if (!response.ok) {
        console.error('Failed to upload file, status:', response.status);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: `File upload failed with status: ${response.status}`,
        });
        return;
      }
  
      const data = await response.json();
      setAnalysisResults(data.analysis);
  
      // Close the spinner and show success message
      Swal.fire({
        icon: 'success',
        title: 'Upload Successful',
        text: 'Your file has been uploaded and processed successfully!',
        timer: 2000,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Error',
        text: 'An error occurred while uploading the file. Please try again.',
      });
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text("JSON Script Analysis Report", pageWidth / 2, 20, { align: "center" });

    // Function to create table data format for each section
    const createTableData = (title, items) => {
      if (items.length === 0) {
        return [[`${title} - No issues detected.`]];
      }
      return items.map((item, index) => [`${title} #${index + 1}`, item]);
    };

    // Data for Dangers Table
    const dangersTableData = createTableData("Danger", analysisResults.errors);
    // Data for Warnings Table
    const warningsTableData = createTableData("Warning", analysisResults.warnings);
    // Data for Good Practices Table
    const goodPracticesTableData = createTableData("Good Practice", analysisResults.good_practices);

    // Add tables to PDF
    const startY = 30; // Initial Y position for the first table

    // Add Danger table
    doc.autoTable({
      startY,
      head: [["Type", "Description"]],
      body: dangersTableData,
      theme: "grid",
      headStyles: { fillColor: [220, 53, 69], textColor: 255 }, // Red for Danger
      columnStyles: { 1: { cellWidth: "auto" } }, // Auto wrap
    });

    // Add Warning table
    doc.autoTable({
      startY: doc.previousAutoTable.finalY + 10,
      head: [["Type", "Description"]],
      body: warningsTableData,
      theme: "grid",
      headStyles: { fillColor: [255, 193, 7], textColor: 0 }, // Yellow for Warning
      columnStyles: { 1: { cellWidth: "auto" } },
    });

    // Add Good Practices table
    doc.autoTable({
      startY: doc.previousAutoTable.finalY + 10,
      head: [["Type", "Description"]],
      body: goodPracticesTableData,
      theme: "grid",
      headStyles: { fillColor: [40, 167, 69], textColor: 255 }, // Green for Good Practices
      columnStyles: { 1: { cellWidth: "auto" } },
    });

    // Save the PDF
    doc.save("JSON_Script_Analysis_Report.pdf");
  };

  return (
    <>
      <CCallout color="primary">
        <h6 className="font-w-500">Notice!</h6>
        This JSON Script scanning procedure may take a few moments to finish.
        Additionally, make sure that the file contains a valid JSON Script.
      </CCallout>
  
      <CCard className="p-0 mb-50">
        <CCardHeader>Upload JSON Script</CCardHeader>
        <CCardBody>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <CButton color="primary" onClick={handleFileUpload}>
            Upload and Scan
          </CButton>
        </CCardBody>
      </CCard>
  
      <CCard className="p-0" style={{ marginBottom: '30px' }}>
        {analysisResults && (
          <CTabs
            activeItemKey={activeTab}
            onActiveTabChange={setActiveTab}
            variant="underline-border"
            className="mt-10"
          >
            <CCardHeader>
              JSON Script Analysis Result
              <CButton color="success" className="float-end" onClick={exportToPDF}>
                Export as PDF
              </CButton>
            </CCardHeader>
            <CTabList variant="underline-border">
              <CTab className="p-3" aria-controls="danger-tab-pane" itemKey="danger">Danger</CTab>
              <CTab className="p-3" aria-controls="warning-tab-pane" itemKey="warnings">Warnings</CTab>
              <CTab className="p-3" aria-controls="good-tab-pane" itemKey="good">Good</CTab>
            </CTabList>
            <CTabContent>
              {/* Danger Tab */}
              <CTabPanel aria-labelledby="danger-tab-pane" className="p-3" itemKey="danger">
                {analysisResults.errors.length > 0 ? (
                  <CAccordion activeItemKey={1}>
                    {analysisResults.errors.map((error, index) => (
                      <CAccordionItem itemKey={index + 1} key={index}>
                        <CAccordionHeader>
                          <CIcon icon={cilWarning} className="me-2" />
                          Danger #{index + 1}
                        </CAccordionHeader>
                        <CAccordionBody>{error}</CAccordionBody>
                      </CAccordionItem>
                    ))}
                  </CAccordion>
                ) : (
                  <p>No dangerous issues detected.</p>
                )}
              </CTabPanel>
  
              {/* Warnings Tab */}
              <CTabPanel aria-labelledby="warning-tab-pane" className="p-3" itemKey="warnings">
                {analysisResults.warnings.length > 0 ? (
                  <CAccordion activeItemKey={1}>
                    {analysisResults.warnings.map((warning, index) => (
                      <CAccordionItem itemKey={index + 1} key={index}>
                        <CAccordionHeader>
                          <CIcon icon={cilLoopCircular} className="me-2" />
                          Warning #{index + 1}
                        </CAccordionHeader>
                        <CAccordionBody>{warning}</CAccordionBody>
                      </CAccordionItem>
                    ))}
                  </CAccordion>
                ) : (
                  <p>No warnings detected.</p>
                )}
              </CTabPanel>
  
              {/* Good Practices Tab */}
              <CTabPanel aria-labelledby="good-tab-pane" className="p-3" itemKey="good">
                {analysisResults.good_practices.length > 0 ? (
                  <CAccordion activeItemKey={1}>
                    {analysisResults.good_practices.map((practice, index) => (
                      <CAccordionItem itemKey={index + 1} key={index}>
                        <CAccordionHeader>
                          <CIcon icon={cilCheckCircle} className="me-2" />
                          Good Practice #{index + 1}
                        </CAccordionHeader>
                        <CAccordionBody>{practice}</CAccordionBody>
                      </CAccordionItem>
                    ))}
                  </CAccordion>
                ) : (
                  <p>No good practices found.</p>
                )}
              </CTabPanel>
            </CTabContent>
          </CTabs>
        )}
      </CCard>
  
      {/* Educational Materials Section */}
      {analysisResults && (
        <CCard className="mt-4" style={{marginBottom: '30px'}}>
          <CCardBody>
            <h5>Educational Materials</h5>
            <h6>Learn how to mitigate these risks now before it's too late!</h6>
            <ul>
              {analysisResults.errors.length > 0 && (
                <li>
                  <a
                    href="http://localhost:3000/icons/coreui-icons#/buttons/buttons"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    About JSON
                  </a>
                </li>
              )}
              {analysisResults.warnings.length > 0 && (
                <li>
                  <a
                    href="/icons/coreui-icons#/buttons/button-groups"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Good Practices for Working with JSON
                  </a>
                </li>
              )}
              {analysisResults.good_practices.length > 0 && (
                <li>
                  <a
                    href="/icons/coreui-icons#/buttons/dropdowns"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Common JSON Mistakes and How to Avoid Them
                  </a>
                </li>
              )}
            </ul>
          </CCardBody>
        </CCard>
      )}
    </>
  );
}  

export default JSONScript;
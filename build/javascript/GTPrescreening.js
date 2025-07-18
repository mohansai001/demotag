
      let collectedData = []; // To hold the processed data
      let shortlistedData = []; // To hold shortlisted candidates
      let rejectedData = []; // To hold rejected candidates

      async function extractInfo(sourceId) {
        const queries = [
          "What is the full name of the candidate? Return only the name, nothing else.",
          "What is the email address that ends with .com, .org, .in, or .outlook? Return only the email, nothing else.",
          "What is the cgpa or CGPA or percentage or Aggregate or C.P.G.A mentioned? Consider the higher graduation like btech or bachelors or bachelors of engineering. Return only the number, nothing else.",
          "What is the contact information of the candidate? Return only the number, nothing else.",
        ];

        const results = await Promise.all(
          queries.map(async (query) => {
            let attempt = 0;
            let data;
            while (attempt < 3) {
              // Retry up to 3 times
              try {
                const response = await fetch(
                  "https://api.chatpdf.com/v1/chats/message",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-api-key": "sec_U9gJ7XetrGWfbji3eM3nE2xknV201N42",
                    },
                    body: JSON.stringify({
                      sourceId,
                      messages: [{ role: "user", content: query }],
                    }),
                  }
                );
                const result = await response.json();
                if (result.content && result.content !== "undefined") {
                  data = result.content;
                  break;
                }
              } catch (error) {
                console.error(`Attempt ${attempt + 1} failed: ${error}`);
              }
              attempt++;
              await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retrying
            }
            return data || "N/A"; // Return 'N/A' if the query fails after retries
          })
        );

        return {
          name: results[0],
          email: results[1],
          cgpa: results[2] ? parseFloat(results[2]) : null,
          contactInfo: results[3] || "N/A",
        };
      }

      async function processResume(file) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const uploadResponse = await fetch(
            "https://api.chatpdf.com/v1/sources/add-file",
            {
              method: "POST",
              headers: {
                "x-api-key": "sec_U9gJ7XetrGWfbji3eM3nE2xknV201N42",
              },
              body: formData,
            }
          );

          const { sourceId } = await uploadResponse.json();
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for processing

          const info = await extractInfo(sourceId);
          return info;
        } catch (error) {
          console.error("Error processing resume: ", error);
          return { name: "N/A", email: "N/A", cgpa: "N/A", contactInfo: "N/A" };
        }
      }

      async function processFolder(files) {
        // Clear previous results in the table only
        collectedData = []; // Reset collected data
        shortlistedData = []; // Reset shortlisted data
        rejectedData = []; // Reset rejected data

        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = ""; // Clear previous results

        const loading = document.getElementById("loading");
        loading.style.display = "block";

        const headers = [
          "Name",
          "Email",
          "CGPA",
          "Contact Information",
          "Status",
        ];
        collectedData.push(headers);

        // Update uploaded resumes count
        document.getElementById("uploaded-count").innerText = files.length;

        for (const file of files) {
          const info = await processResume(file);

          // Process CGPA
          let cgpa = parseFloat(info.cgpa);
          if (cgpa > 10) {
            cgpa = cgpa / 10;
          }

          const status = cgpa >= 7.5 ? "Shortlisted" : "Rejected";
          collectedData.push([
            info.name,
            info.email,
            cgpa !== null ? cgpa.toFixed(2) : "N/A",
            info.contactInfo,
            status,
          ]);

          if (status === "Shortlisted") {
            shortlistedData.push([
              info.name,
              info.email,
              cgpa !== null ? cgpa.toFixed(2) : "N/A",
              info.contactInfo,
            ]);
          } else {
            rejectedData.push([
              info.name,
              info.email,
              cgpa !== null ? cgpa.toFixed(2) : "N/A",
              info.contactInfo,
            ]);
          }
        }

        // Update shortlisted and rejected counts
        document.getElementById("shortlisted-count").innerText =
          shortlistedData.length;
        document.getElementById("rejected-count").innerText =
          rejectedData.length;

        // Display results in the results div
        resultsDiv.style.display = "block";
        const resultsTable = document.createElement("table");
        resultsTable.style.width = "100%";
        resultsTable.style.borderCollapse = "collapse";
        resultsTable.style.marginTop = "20px";

        // Create header row
        const headerRow = document.createElement("tr");
        headers.forEach((header) => {
          const th = document.createElement("th");
          th.style.border = "1px solid #ffffff";
          th.style.padding = "10px";
          th.style.textAlign = "center";
          th.textContent = header;
          headerRow.appendChild(th);
        });
        resultsTable.appendChild(headerRow);

        // Create data rows
        collectedData.slice(1).forEach((row) => {
          const dataRow = document.createElement("tr");
          row.forEach((cell) => {
            const td = document.createElement("td");
            td.style.border = "1px solid #ffffff";
            td.style.padding = "10px";
            td.style.textAlign = "center";
            td.textContent = cell;
            dataRow.appendChild(td);
          });
          resultsTable.appendChild(dataRow);
        });

        resultsDiv.appendChild(resultsTable);
        loading.style.display = "none";
        document.getElementById("generate-button").style.display = "block"; // Show the download button
      }

      async function generateExcel() {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(collectedData);
        XLSX.utils.book_append_sheet(wb, ws, "Resumes");

        // Generate Excel file
        XLSX.writeFile(wb, "resume_analysis.xlsx");
      }

      document
        .getElementById("file-input")
        .addEventListener("change", (event) => {
          const files = Array.from(event.target.files);
          processFolder(files);
          document.getElementById(
            "file-name"
          ).textContent = `${files.length} file(s) selected`;
        });
      function navigateToPage() {
        window.location.href = "Dashboard.html";
      }
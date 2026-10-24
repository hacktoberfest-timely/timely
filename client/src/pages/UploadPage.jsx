function UploadPage() {
    const goHome = () => {
        window.location.href = '/';
    };

return (
  <main>
    <h1>Please upload your schedule below: </h1>
    <p> Select your schedule file:</p>
   <input type="file" id="schedule"  accept=".pdf, .png.jpg.jpeg" />
    <br></br>


    <button type="button" onclick="alert('Schedule uploaded!')">Submit</button>

    <button type="button" onclick={goHome}>Return to Home Page</button>
   
  </main>
)
}

export default UploadPage;

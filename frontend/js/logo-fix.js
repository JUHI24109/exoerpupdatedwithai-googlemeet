// Shared logo white-background remover
// Finds all images with class "sidebar-logo" and removes white background using canvas
(function(){
    document.addEventListener('DOMContentLoaded', fixLogos);
    // Also run immediately for dynamically injected sidebars
    setTimeout(fixLogos, 100);

    function fixLogos(){
        document.querySelectorAll('img.sidebar-logo').forEach(img => {
            if(img.dataset.fixed) return;
            img.dataset.fixed = '1';

            const process = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                ctx.drawImage(img, 0, 0);
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const d = imageData.data;
                    for(let i = 0; i < d.length; i += 4){
                        if(d[i] > 240 && d[i+1] > 240 && d[i+2] > 240){
                            d[i+3] = 0;
                        }
                    }
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.putImageData(imageData, 0, 0);
                    img.src = canvas.toDataURL('image/png');
                } catch(e){ /* CORS or security error, leave original */ }
            };

            if(img.complete && img.naturalWidth) process();
            else img.onload = process;
        });
    }
})();

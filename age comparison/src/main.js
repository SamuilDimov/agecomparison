import * as faceapi from 'face-api.js';

const video = document.getElementById('webcam');
const webcamWrapper = document.getElementById('webcamWrapper');
const statusBox = document.getElementById('statusBox');
const photoBox = document.getElementById('photoBox');
const reflectBtn = document.getElementById('reflectBtn');
const scannerUI = document.getElementById('scannerUI');
const restartBtn = document.getElementById('restartBtn');

reflectBtn.addEventListener('click', () => {
  reflectBtn.style.display = 'none';
  scannerUI.classList.add('visible');
  startScanner();
});

restartBtn.addEventListener('click', () => {
  restartBtn.style.display = 'none';
  photoBox.classList.remove('loaded', 'missing');
  updateStatus('🔄 Restarting...');
  setTimeout(() => {
    scanUserAge();
  }, 600);
});

function startScanner() {
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
    video.onloadeddata = async () => {
      video.classList.add('visible');
      try {
        updateStatus('🔁 Loading models...');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.ageGenderNet.loadFromUri('/models')
        ]);
        scanUserAge();
      } catch (err) {
        updateStatus('❌ Failed to load face models.\nCheck /models folder.');
        console.error('Model load error:', err);
      }
    };
  }).catch(err => {
    updateStatus('❌ Webcam access denied.');
    console.error('Webcam error:', err);
  });
}

function updateStatus(text) {
  statusBox.classList.remove('visible');
  setTimeout(() => {
    statusBox.innerText = text;
    statusBox.classList.add('visible');
  }, 50);
}

function scanUserAge() {
  let scanTime = 5000;
  let ageSum = 0;
  let count = 0;

  statusBox.classList.add('scanning');
  updateStatus('🔍 Scanning your face...');
  webcamWrapper.classList.remove('lifted');

  const interval = setInterval(async () => {
    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
        .withAgeAndGender()
        .withFaceExpressions();
      if (detection) {
        ageSum += detection.age;
        count++;
      }
    } catch (err) {
      console.warn("Detection error:", err);
    }
  }, 500);

  setTimeout(() => {
    clearInterval(interval);
    statusBox.classList.remove('scanning');

    const avgAge = count > 0 ? ageSum / count : null;
    if (avgAge) {
      const roundedAge = Math.round(avgAge);
      showArchiveMessage(roundedAge);
    } else {
      updateStatus('❌ No face detected during scan.');
    }
  }, scanTime);
}

function showArchiveMessage(age) {
  const sampleMatches = {
    10: {
      name: 'Ruth',
      age: 10,
      story: 'Ruth, age 10, deported to Theresienstadt.',
      img: 'ruth.jpg',
      quote: '“I was too young to understand, but I remember the silence.”'
    },
    18: {
      name: 'David',
      age: 18,
      story: 'David, age 18, forced into labor in 1942.',
      img: 'david.jpg',
      quote: '“They gave me a shovel and took my name.”'
    },
    30: {
      name: 'Miriam',
      age: 30,
      story: 'Miriam, age 30, hid her children in a cellar.',
      img: 'miriam.jpg',
      quote: '“The floor creaked every time they breathed.”'
    },
    45: {
      name: 'Jakob',
      age: 45,
      story: 'Jakob, age 45, survived Auschwitz.',
      img: null,
      quote: '“Some names were erased. I was not one of them.”'
    }
  };

  const closest = Object.keys(sampleMatches)
    .map(a => parseInt(a))
    .reduce((prev, curr) => Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev);

  const match = sampleMatches[closest];
  const imgSrc = match.img ? `/images/${match.img}` : '/images/question.png';

  photoBox.classList.remove('missing', 'loaded');
  photoBox.style.opacity = 0;

  photoBox.onload = () => {
    photoBox.classList.add('loaded');
    photoBox.style.opacity = 1;
  };

  if (match.img) {
    photoBox.src = imgSrc;
  } else {
    photoBox.src = '/images/question.png';
    photoBox.classList.add('missing');
    photoBox.style.opacity = 1;
  }

  updateStatus(
    `📍 Age detected: ${age}\n🕯 ${match.story}\n${match.quote}\n\nThat could have been you.`
  );

  webcamWrapper.classList.add('lifted');
  restartBtn.style.display = 'inline-block';

  setTimeout(() => {
    restartBtn.style.display = 'none';
    photoBox.classList.remove('loaded', 'missing');
    updateStatus('🔄 Ready for next visitor...');
    scanUserAge();
  }, 10000);
}

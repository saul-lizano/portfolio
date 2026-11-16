const threeUrl = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

import(threeUrl)
    .then(({ ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera, PointLight, Points, PointsMaterial, Scene, SphereGeometry, TorusGeometry, Vector3, WebGLRenderer }) => {
        const canvas = document.getElementById('scene-canvas');
        const showcase = document.querySelector('.showcase');
        const projectPanels = [...document.querySelectorAll('.project-panel')];
        const storyPanels = [...document.querySelectorAll('.story-panel')];
        if (!canvas || !showcase || !projectPanels.length || !storyPanels.length) return;

        const scene = new Scene();
        const camera = new PerspectiveCamera(38, 1, 0.1, 100);
        const targetPosition = new Vector3();
        const targetFocus = new Vector3();
        const currentFocus = new Vector3();
        const origin = new Vector3();
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let renderer;
        try {
            renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
        } catch (error) {
            console.warn('La escena 3D no está disponible en este navegador.', error);
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = 'srgb';
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;

        scene.add(new AmbientLight(0xd8e8d5, 1.35));
        const keyLight = new DirectionalLight(0xd7ffc0, 3.2);
        keyLight.position.set(-3, 4, 5);
        scene.add(keyLight);
        const fillLight = new DirectionalLight(0xa899ff, 2.4);
        fillLight.position.set(4, -2, 2);
        scene.add(fillLight);
        const nucleusLight = new PointLight(0xc6f4a8, 4.5, 6, 2);
        nucleusLight.position.set(0, 0, 0.3);
        scene.add(nucleusLight);

        const atom = new Group();
        scene.add(atom);

        const nucleus = new Group();
        atom.add(nucleus);
        const nucleonGeometry = new SphereGeometry(0.27, 40, 32);
        const protonMaterial = new MeshPhysicalMaterial({
            color: 0xd9caff,
            emissive: 0x4b397b,
            emissiveIntensity: 0.42,
            roughness: 0.3,
            metalness: 0.08,
            clearcoat: 0.9,
            clearcoatRoughness: 0.16
        });
        const neutronMaterial = new MeshPhysicalMaterial({
            color: 0xc8eea9,
            emissive: 0x354c29,
            emissiveIntensity: 0.34,
            roughness: 0.32,
            metalness: 0.06,
            clearcoat: 0.85,
            clearcoatRoughness: 0.18
        });
        nucleus.add(new Mesh(
            new SphereGeometry(0.54, 40, 28),
            new MeshBasicMaterial({
                color: 0xcfffb0,
                transparent: true,
                opacity: 0.045,
                blending: AdditiveBlending,
                depthWrite: false
            })
        ));

        for (let index = 0; index < 7; index++) {
            const y = 1 - (index / 6) * 2;
            const ringRadius = Math.sqrt(1 - y * y);
            const angle = Math.PI * (3 - Math.sqrt(5)) * index;
            const nucleon = new Mesh(nucleonGeometry, index < 3 ? protonMaterial : neutronMaterial);
            nucleon.position.set(
                Math.cos(angle) * ringRadius * 0.22,
                y * 0.22,
                Math.sin(angle) * ringRadius * 0.22
            );
            nucleus.add(nucleon);
        }

        const electronGeometry = new SphereGeometry(0.105, 32, 24);
        const electronMaterial = new MeshPhysicalMaterial({
            color: 0xf2f4ef,
            emissive: 0xbcf58a,
            emissiveIntensity: 1.8,
            roughness: 0.16,
            metalness: 0.08,
            clearcoat: 0.9
        });
        const electronGlowGeometry = new SphereGeometry(0.23, 24, 20);
        const electronGlowMaterial = new MeshBasicMaterial({
            color: 0xbcf58a,
            transparent: true,
            opacity: 0.13,
            blending: AdditiveBlending,
            depthWrite: false
        });
        const electronTargets = [];
        const innerOrbit = new Group();
        innerOrbit.rotation.set(0.88, 0.18, 0.3);
        atom.add(innerOrbit);

        const outerOrbit = new Group();
        outerOrbit.rotation.set(1.3, 0.32, -0.5);
        atom.add(outerOrbit);

        [
            { orbit: innerOrbit, radius: 1.55, rotation: [0.88, 0.18, 0.3], electrons: [-1, 1], color: 0xc9b9ff },
            { orbit: outerOrbit, radius: 2.35, rotation: [1.3, 0.32, -0.5], electrons: [1], color: 0xbcf58a }
        ].forEach(({ orbit, radius, rotation, electrons, color }) => {
            const glowTrack = new Mesh(
                new TorusGeometry(radius, 0.045, 12, 192),
                new MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.09,
                    blending: AdditiveBlending,
                    depthWrite: false
                })
            );
            glowTrack.rotation.set(...rotation);
            atom.add(glowTrack);

            const track = new Mesh(
                new TorusGeometry(radius, 0.009, 10, 192),
                new MeshPhysicalMaterial({
                    color,
                    roughness: 0.3,
                    metalness: 0.2,
                    transparent: true,
                    opacity: 0.68
                })
            );
            track.rotation.set(...rotation);
            atom.add(track);

            electrons.forEach(direction => {
                const electron = new Mesh(electronGeometry, electronMaterial);
                electron.position.set(radius * direction, 0, 0);
                electron.add(new Mesh(electronGlowGeometry, electronGlowMaterial));
                orbit.add(electron);
                electronTargets.push(electron);
            });
        });

        const starPositions = [];
        for (let index = 0; index < 220; index++) {
            starPositions.push(
                (Math.random() - 0.5) * 13,
                (Math.random() - 0.5) * 9,
                (Math.random() - 0.5) * 6 - 2
            );
        }
        const starGeometry = new BufferGeometry();
        starGeometry.setAttribute('position', new BufferAttribute(new Float32Array(starPositions), 3));
        scene.add(new Points(
            starGeometry,
            new PointsMaterial({ color: 0xe7f2e2, size: 0.022, transparent: true, opacity: 0.35 })
        ));

        function resize() {
            const width = canvas.clientWidth || window.innerWidth;
            const height = canvas.clientHeight || window.innerHeight;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            updateCameraTarget();
            if (reducedMotion) {
                camera.position.copy(targetPosition);
                camera.lookAt(targetFocus);
                renderer.render(scene, camera);
            }
        }

        function updateCameraTarget() {
            const firstPanel = storyPanels[0].getBoundingClientRect();
            const lastPanel = storyPanels[storyPanels.length - 1].getBoundingClientRect();
            const firstCenter = firstPanel.top + firstPanel.height / 2;
            const lastCenter = lastPanel.top + lastPanel.height / 2;
            const progress = Math.max(0, Math.min(1, (window.innerHeight / 2 - firstCenter) / (lastCenter - firstCenter)));
            const lastStop = projectPanels.length;
            const stop = progress * lastStop;
            const fromIndex = Math.floor(stop);
            const toIndex = Math.min(fromIndex + 1, lastStop);
            const blend = stop - fromIndex;
            const targetAtStop = index => index === 0 || index === lastStop
                ? origin
                : electronTargets[index - 1].getWorldPosition(new Vector3());
            const from = targetAtStop(fromIndex);
            const to = targetAtStop(toIndex);
            targetFocus.copy(from).lerp(to, blend).multiplyScalar(0.3);

            const angle = progress * Math.PI * 2;
            const radius = window.innerWidth < 620 ? 9.6 : 8.2;
            targetPosition.set(
                Math.sin(angle) * radius,
                Math.sin(angle * 2) * radius * 0.18,
                Math.cos(angle) * radius
            );
        }

        let scrollFrame = 0;
        function onScroll() {
            if (scrollFrame) return;
            scrollFrame = requestAnimationFrame(() => {
                scrollFrame = 0;
                updateCameraTarget();
                if (reducedMotion) {
                    camera.position.copy(targetPosition);
                    camera.lookAt(targetFocus);
                    renderer.render(scene, camera);
                }
            });
        }

        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        resize();
        scene.updateMatrixWorld(true);
        updateCameraTarget();
        document.documentElement.classList.add('three-ready');

        if (reducedMotion) {
            camera.position.copy(targetPosition);
            camera.lookAt(targetFocus);
            renderer.render(scene, camera);
            return;
        }

        let previousFrameTime = 0;
        function animate(now) {
            requestAnimationFrame(animate);
            const elapsed = previousFrameTime ? Math.min((now - previousFrameTime) / 1000, 0.05) : 1 / 60;
            previousFrameTime = now;
            const easing = 1 - Math.exp(-elapsed * 6);
            camera.position.lerp(targetPosition, easing);
            currentFocus.lerp(targetFocus, easing);
            camera.lookAt(currentFocus);
            renderer.render(scene, camera);
        }

        animate();
    })
    .catch(error => {
        console.warn('No se pudo cargar Three.js; se mostrará la ilustración alternativa.', error);
    });

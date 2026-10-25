# Quantum Computing System Architecture

## Overview
The Rigetti Quantum Processor Unit (QPU) operates in a cryogenic dilution refrigerator at a temperature of 15 millikelvin. It features 84 superconducting transmon qubits arranged in a square-octagonal lattice with tunable couplers.

## Pulse Control and Calibration
Control pulses are delivered using arbitrary waveform generators (AWGs) operating at microwave frequencies between 4.5 GHz and 6.0 GHz. Coherence times achieve T1 relaxation of 42 microseconds and T2 dephasing of 38 microseconds.

## Quantum Error Mitigation
Zero-noise extrapolation (ZNE) and readout error mitigation (REM) are applied before results are returned to classical host nodes. The high-performance classical compiler applies topological qubit routing to minimize SWAP gate overhead.

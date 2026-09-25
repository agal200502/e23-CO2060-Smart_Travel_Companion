package com.smarttravel.backend.service;

import com.smarttravel.backend.model.User;
import com.smarttravel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null) {
            throw new UsernameNotFoundException("Email is null");
        }
        String trimmed = email.trim();
        User user = userRepository.findByEmail(trimmed)
                .or(() -> userRepository.findByEmail(trimmed.toLowerCase()))
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email : " + email)
        );


        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(user.getRole()));

        return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), authorities);
    }
}
